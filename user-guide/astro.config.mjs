// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'x402 ユーザーガイド',
			description: 'x402決済プラットフォームの使い方ガイド',
			defaultLocale: 'root',
			locales: {
				root: {
					label: '日本語',
					lang: 'ja',
				},
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/x402' },
			],
			sidebar: [
				{
					label: 'はじめに',
					items: [
						{ label: 'x402とは', slug: 'guides/introduction' },
						{ label: 'クイックスタート', slug: 'guides/quickstart' },
					],
				},
				{
					label: 'ユースケース',
					items: [
						{ label: '商品を閲覧する', slug: 'usecases/browse-products' },
						{ label: '商品を購入する', slug: 'usecases/purchase' },
						{ label: '購入履歴を確認する', slug: 'usecases/history' },
					],
				},
				{
					label: 'アカウント',
					items: [
						{ label: '新規登録', slug: 'account/register' },
						{ label: 'パスキー認証', slug: 'account/passkey' },
					],
				},
				{
					label: 'FAQ',
					autogenerate: { directory: 'faq' },
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
