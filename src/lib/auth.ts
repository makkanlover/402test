/**
 * 認証サービス
 * WebAuthn（パスキー）認証とセッション管理
 */
import { prisma } from "./db";
import { v4 as uuidv4 } from "uuid";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransport,
} from "@simplewebauthn/types";

// RP（Relying Party）設定
const RP_NAME = process.env.PASSKEY_RP_NAME || "x402 Payment Platform";
const RP_ID = process.env.PASSKEY_RP_ID || "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// セッション有効期限（24時間）
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// チャレンジを一時保存するためのマップ（本番では Redis 等を使用）
const challengeStore = new Map<string, string>();

/**
 * ユーザーを登録
 */
export async function registerUser(email: string, name: string) {
  // メールアドレスの重複チェック
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("このメールアドレスは既に登録されています");
  }

  // ユーザーを作成
  const user = await prisma.user.create({
    data: { email, name },
  });

  return user;
}

/**
 * メールアドレスでユーザーを検索
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * IDでユーザーを検索
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * パスキー登録オプションを生成
 */
export async function generatePasskeyRegistrationOptions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });

  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }

  // 既存のパスキーを除外リストに追加
  const excludeCredentials = user.passkeys.map((passkey) => ({
    id: passkey.credentialId,
  }));

  // パスキー登録オプションを生成
  // residentKey: "required" により Discoverable Credential（Passkey）として登録
  // これにより allowCredentials を空にした認証が可能になる
  // authenticatorAttachment は指定しない（platform/cross-platform両方許可）
  // これによりスマホからのQRコード経由での登録も可能
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "required",  // Discoverable Credential として登録（必須）
      userVerification: "preferred",
      // authenticatorAttachment は指定しない = すべての認証器タイプを許可
    },
  });

  // チャレンジを保存
  challengeStore.set(userId, options.challenge);

  return options;
}

/**
 * パスキー登録レスポンスを検証
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON
): Promise<boolean> {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) {
    throw new Error("チャレンジが見つかりません");
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (error) {
    console.error("パスキー登録検証エラー:", error);
    throw new Error("パスキー登録の検証に失敗しました");
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("パスキー登録の検証に失敗しました");
  }

  // transports を取得（スマホ認証等の cross-device 対応に必要）
  const transports = response.response?.transports?.join(',') || null;

  // パスキーを保存
  // credentialId は response.id をそのまま使用（認証時に response.id で検索するため）
  // publicKey は Uint8Array なので Base64URL エンコードして保存
  await prisma.passkey.create({
    data: {
      userId,
      credentialId: response.id,  // 認証時の response.id と一致させるため
      publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString("base64url"),
      counter: BigInt(verification.registrationInfo.credential.counter),
      transports,
    },
  });

  // チャレンジを削除
  challengeStore.delete(userId);

  return true;
}

/**
 * パスキー認証オプションを生成
 *
 * クロスデバイス認証（スマホ等）を有効にするため、allowCredentialsを空にして
 * Discoverable Credentials（Passkey）方式を使用する。
 * これによりブラウザは登録済みのすべてのパスキーを表示し、
 * ユーザーはスマホを含む任意のデバイスを選択できる。
 */
export async function generatePasskeyAuthenticationOptions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });

  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }

  if (user.passkeys.length === 0) {
    throw new Error("パスキーが登録されていません");
  }

  // allowCredentials を空にすることで、Discoverable Credentials（Passkey）方式を使用
  // これにより、ブラウザはすべての利用可能なパスキーを表示し、
  // ユーザーはスマホを含む任意のデバイスを選択できる
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: [],  // 空配列でDiscoverable Credentials方式
    userVerification: "preferred",
  });

  // チャレンジを保存
  challengeStore.set(userId, options.challenge);

  return options;
}

/**
 * パスキー認証レスポンスを検証
 */
export async function verifyPasskeyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON
): Promise<boolean> {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) {
    throw new Error("チャレンジが見つかりません");
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
  });

  if (!passkey || passkey.userId !== userId) {
    throw new Error("パスキーが見つかりません");
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
        counter: Number(passkey.counter),
      },
    });
  } catch (error) {
    console.error("パスキー認証検証エラー:", error);
    throw new Error("パスキー認証の検証に失敗しました");
  }

  if (!verification.verified) {
    throw new Error("パスキー認証の検証に失敗しました");
  }

  // カウンターを更新
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  // チャレンジを削除
  challengeStore.delete(userId);

  return true;
}

/**
 * セッションを作成
 */
export async function createSession(userId: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * セッションを検証
 */
export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // 有効期限チェック
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

/**
 * セッションを削除（ログアウト）
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
