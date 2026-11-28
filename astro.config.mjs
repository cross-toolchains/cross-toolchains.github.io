// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightLinksValidator from 'starlight-links-validator';
import releasesSidebar from './src/data/releases-sidebar.json' with { type: 'json' };

export default defineConfig({
	site: 'https://cross-toolchains.github.io',
	devToolbar: { enabled: false },
	integrations: [
		starlight({
			title: 'Xross',
			description: 'Better, simpler, faster cross-compilation toolchains — zero Docker, from anywhere.',
			favicon: '/favicon.svg',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
				fr: {
					label: 'Français',
					lang: 'fr',
				},
				es: {
					label: 'Español',
					lang: 'es',
				},
				'zh-cn': {
					label: '简体中文',
					lang: 'zh-CN',
				},
				ja: {
					label: '日本語',
					lang: 'ja',
				},
				de: {
					label: 'Deutsch',
					lang: 'de',
				},
			},
			logo: {
				light: './src/assets/wordmark-light.svg',
				dark: './src/assets/wordmark-dark.svg',
				replacesTitle: true,
			},
			components: {
				Header: './src/components/Header.astro',
				ThemeSelect: './src/components/ThemeToggle.astro',
				Footer: './src/components/Footer.astro',
			},
			customCss: ['./src/styles/custom.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/cross-toolchains',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/cross-toolchains/cross-toolchains.github.io/edit/main/',
			},
			plugins: [
				starlightSidebarTopics([
					{
						label: {
							en: 'Guides',
							fr: 'Guides',
							es: 'Guías',
							'zh-CN': '指南',
							ja: 'ガイド',
							de: 'Anleitungen',
						},
						icon: 'open-book',
						link: '/overview/getting-started/',
						items: [
							{
								label: 'Quick Start',
								translations: { 'zh-CN': '快速开始' },
								collapsed: false,
								items: [
									{
										label: 'Getting Started',
										translations: {
											fr: 'Démarrage',
											es: 'Primeros pasos',
											'zh-CN': '快速上手',
											ja: 'はじめに',
											de: 'Erste Schritte',
										},
										slug: 'overview/getting-started',
									},
									{
										label: 'Artifact Blueprint',
										translations: {
											fr: 'Plan des artefacts',
											es: 'Plano de artefactos',
											'zh-CN': '产物蓝图',
											ja: '成果物ブループリント',
											de: 'Artefakt-Entwurf',
										},
										slug: 'overview/blueprint',
									},
									{
										label: 'Roadmap',
										translations: {
											fr: 'Feuille de route',
											es: 'Hoja de ruta',
											'zh-CN': '路线图',
											ja: 'ロードマップ',
											de: 'Roadmap',
										},
										slug: 'overview/roadmap',
									},
								],
							},
							{
								label: 'Foundation',
								translations: {
									fr: 'Fondations',
									es: 'Base',
									'zh-CN': '基础层',
									ja: '基盤',
									de: 'Grundlagen',
								},
								collapsed: true,
								items: [
									{
										label: 'xtarget',
										slug: 'tools/xtarget',
									},
								],
							},
							{
								label: 'Sysroots',
								translations: { 'zh-CN': '目标 Sysroots' },
								collapsed: true,
								items: [
									{
										label: 'xsysroot',
										slug: 'tools/xsysroot',
									},
								],
							},
							{
								label: 'Compilers',
								translations: { 'zh-CN': '便携编译器' },
								collapsed: true,
								items: [
									{
										label: 'xcompiler',
										slug: 'tools/xcompiler',
									},
									{
										label: 'llvm-slim',
										slug: 'tools/llvm-slim',
									},
								],
							},
							{
								label: 'Pipeline',
								translations: { 'zh-CN': '构建与打包管线' },
								collapsed: true,
								items: [
									{
										label: 'xforge, xsign, xbundle & xross',
										slug: 'tools/upcoming',
									},
								],
							},
						],
					},
					{
						label: {
							en: 'Blueprint',
							fr: 'Plan',
							es: 'Plano',
							'zh-CN': '蓝图',
							ja: 'ブループリント',
							de: 'Entwurf',
						},
						icon: 'document',
						link: '/overview/blueprint/',
						items: [],
					},
					{
						label: {
							en: 'Roadmap',
							fr: 'Feuille de route',
							es: 'Hoja de ruta',
							'zh-CN': '路线图',
							ja: 'ロードマップ',
							de: 'Roadmap',
						},
						icon: 'list-format',
						link: '/overview/roadmap/',
						items: [],
					},
					{
						label: {
							en: 'Releases',
							fr: 'Versions',
							es: 'Versiones',
							'zh-CN': '发布记录',
							ja: 'リリース',
							de: 'Releases',
						},
						icon: 'rocket',
						link: '/releases/',
						items: [
							{
								label: 'All Releases',
								translations: { 'zh-CN': '全部版本' },
								slug: 'releases',
							},
							...releasesSidebar,
						],
					},
				]),
				starlightLlmsTxt({
					projectName: 'Xross',
					description: 'Better, simpler, faster cross-compilation toolchains — zero Docker, from anywhere.',
				}),
				starlightLinksValidator({
					errorOnFallbackPages: false,
				}),
			],
		}),
	],
});
