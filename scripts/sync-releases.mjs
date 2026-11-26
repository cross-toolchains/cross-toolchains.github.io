import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RELEASES_DIR = path.join(ROOT, 'src/content/docs/releases');
const SIDEBAR_JSON = path.join(ROOT, 'src/data/releases-sidebar.json');

const ORG = 'cross-toolchains';

const GROUPS = [
	{
		title: 'xsysroot',
		repo: 'xsysroot',
		crates: [
			{ name: 'xsysroot', desc: 'Unified CLI facade for zero-Docker target sysroots.' },
			{ name: 'xlinux', desc: 'Linux glibc & musl sysroot fetcher and Clang wrapper.' },
			{ name: 'xmac', desc: 'macOS SDK sysroot extractor for cross-compilation.' },
			{ name: 'xios', desc: 'iOS device & simulator SDK sysroot extractor.' },
			{ name: 'xdroid', desc: 'Android NDK sysroot + per-ABI LLVM runtime bundler.' },
			{ name: 'xohos', desc: 'OpenHarmony NDK sysroot + per-ABI LLVM runtime bundler.' },
			{ name: 'xsysroot-core', desc: 'Shared archive, symlink, and wrapper utilities for xsysroot.' },
		],
	},
	{
		title: 'xcompiler',
		repo: 'xcompiler',
		crates: [
			{ name: 'xcompiler', desc: 'Unified CLI facade for portable cross-compilers.' },
			{ name: 'xllvm', desc: 'Portable multi-target Clang + LLD manager backed by llvm-slim.' },
			{ name: 'xgcc', desc: 'Portable MinGW-w64 & bare-metal ARM/RISC-V GCC manager.' },
			{ name: 'xcompiler-core', desc: 'Shared download, archive, and doctor utilities for xcompiler.' },
		],
	},
	{
		title: 'llvm-slim',
		repo: 'llvm-slim',
		crates: [],
	},
];

const ghHeaders = {
	Accept: 'application/vnd.github+json',
	'User-Agent': 'cross-toolchains-website',
};
if (process.env.GITHUB_TOKEN) {
	ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const cratesHeaders = {
	'User-Agent': 'cross-toolchains-website (https://cross-toolchains.github.io)',
};

function formatDate(iso) {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
	const units = ['B', 'KiB', 'MiB', 'GiB'];
	let idx = 0;
	let val = bytes;
	while (val >= 1024 && idx < units.length - 1) {
		val /= 1024;
		idx += 1;
	}
	return `${val.toFixed(val >= 10 || idx === 0 ? 1 : 2)} ${units[idx]}`;
}

function sanitizeSlug(tag) {
	return tag
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function escapeYaml(str) {
	return JSON.stringify(String(str ?? ''));
}

function escapeHtml(str) {
	return String(str ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function escapeMdxBody(body) {
	if (!body || !body.trim()) return '_No release notes provided._';
	const lines = body.replace(/\r\n/g, '\n').split('\n');
	let inFence = false;
	return lines
		.map((line) => {
			if (/^\s*```/.test(line)) {
				inFence = !inFence;
				return line;
			}
			if (inFence) return line;
			return line.replace(/<(?!\/?(a|br|code|details|summary|img|picture|source|strong|em|sub|sup)\b)/gi, '&lt;');
		})
		.join('\n');
}

async function fetchRepoReleases(repo) {
	const url = `https://api.github.com/repos/${ORG}/${repo}/releases?per_page=20`;
	const res = await fetch(url, { headers: ghHeaders });
	if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo}`);
	const data = await res.json();
	return data.filter((r) => !r.draft);
}

async function fetchCrateInfo(name) {
	const url = `https://crates.io/api/v1/crates/${name}`;
	const res = await fetch(url, { headers: cratesHeaders });
	if (!res.ok) throw new Error(`crates.io ${res.status} for ${name}`);
	const data = await res.json();
	const crate = data.crate || {};
	const versions = (data.versions || []).filter((v) => !v.yanked);
	const latest = versions[0] || {};
	return {
		version: crate.max_stable_version || crate.newest_version || '0.1.0',
		date: formatDate(latest.created_at || crate.updated_at),
		versions: versions.slice(0, 15).map((v) => ({
			num: v.num,
			date: formatDate(v.created_at),
		})),
	};
}

function renderCard({ name, desc, badge, date, href }) {
	return [
		`  <a class="xt-rel-card" href="${escapeHtml(href)}">`,
		`    <div class="xt-rel-head">`,
		`      <span class="xt-rel-name">${escapeHtml(name)}</span>`,
		`      <span class="xt-rel-arrow" aria-hidden="true">→</span>`,
		`    </div>`,
		`    <p class="xt-rel-desc">${escapeHtml(desc)}</p>`,
		`    <div class="xt-rel-foot">`,
		`      <span class="xt-rel-badge">${escapeHtml(badge)}</span>`,
		`      <span class="xt-rel-date">${escapeHtml(date)}</span>`,
		`    </div>`,
		`  </a>`,
	].join('\n');
}

async function main() {
	await mkdir(RELEASES_DIR, { recursive: true });
	await mkdir(path.dirname(SIDEBAR_JSON), { recursive: true });

	const sidebarGroups = [];
	const sections = [];

	for (const group of GROUPS) {
		let ghReleases = [];
		try {
			ghReleases = await fetchRepoReleases(group.repo);
		} catch (err) {
			console.warn(`[sync-releases] Warning: GitHub ${group.repo}: ${err.message}`);
		}

		// Index GitHub releases by normalized version (e.g. "0.1.1" -> release)
		const ghByVersion = new Map();
		for (const rel of ghReleases) {
			const clean = rel.tag_name.replace(/^v/, '');
			ghByVersion.set(clean, rel);
			ghByVersion.set(rel.tag_name, rel);
		}

		const repoDir = path.join(RELEASES_DIR, group.repo);
		await rm(repoDir, { recursive: true, force: true });
		await mkdir(repoDir, { recursive: true });

		const groupSidebarItems = [];
		const cards = [];

		// 1. Crate release log pages (xsysroot / xcompiler)
		for (const c of group.crates) {
			let info = {
				version: '0.1.0',
				date: '—',
				versions: [{ num: '0.1.0', date: '—' }],
			};
			try {
				info = await fetchCrateInfo(c.name);
			} catch (err) {
				console.warn(`[sync-releases] Warning: crates.io ${c.name}: ${err.message}`);
			}

			const slugPart = sanitizeSlug(c.name);
			const slug = `releases/${group.repo}/${slugPart}`;
			const href = `/${slug}/`;

			const versionSections = info.versions.map((v) => {
				const gh = ghByVersion.get(v.num) || ghByVersion.get(`${c.name}-v${v.num}`);
				const heading = `## v${v.num} (${v.date})`;
				if (gh) {
					return [
						heading,
						'',
						`[GitHub Release](${gh.html_url}) · [crates.io](https://crates.io/crates/${c.name}/${v.num})`,
						'',
						escapeMdxBody(gh.body),
						'',
					].join('\n');
				}
				return [
					heading,
					'',
					`Published to [crates.io](https://crates.io/crates/${c.name}/${v.num}) · [docs.rs](https://docs.rs/${c.name}/${v.num})`,
					'',
					v.num === '0.1.0'
						? `Initial release of \`${c.name}\` — ${c.desc}`
						: `Released \`${c.name} v${v.num}\`.`,
					'',
				].join('\n');
			});

			const mdx = [
				'---',
				`title: ${escapeYaml(c.name)}`,
				`description: ${escapeYaml(`Release log for ${c.name} — ${c.desc}`)}`,
				'editUrl: false',
				'---',
				'',
				`${c.desc}`,
				'',
				`**Latest:** \`${info.version}\` (${info.date}) · [crates.io](https://crates.io/crates/${c.name}) · [docs.rs](https://docs.rs/${c.name}) · [GitHub](https://github.com/${ORG}/${group.repo})`,
				'',
				'```sh',
				`cargo install ${c.name}`,
				'```',
				'',
				...versionSections,
			].join('\n');

			await writeFile(path.join(repoDir, `${slugPart}.mdx`), mdx, 'utf8');
			groupSidebarItems.push({ label: c.name, slug });

			cards.push(
				renderCard({
					name: c.name,
					desc: c.desc,
					badge: `crate ${info.version}`,
					date: info.date,
					href,
				}),
			);
		}

		// 2. Binary GitHub Release pages (llvm-slim)
		if (group.crates.length === 0 && ghReleases.length > 0) {
			for (const rel of ghReleases.slice(0, 12)) {
				const slugPart = sanitizeSlug(rel.tag_name);
				const slug = `releases/${group.repo}/${slugPart}`;
				const date = formatDate(rel.published_at || rel.created_at);
				const title = `${group.repo} ${rel.tag_name}`;

				const assetsSection =
					rel.assets && rel.assets.length > 0
						? [
								'## Download Assets',
								'',
								'| Asset | Size |',
								'|---|---|',
								...rel.assets.map(
									(a) => `| [\`${a.name}\`](${a.browser_download_url}) | ${formatBytes(a.size)} |`,
								),
								'',
							].join('\n')
						: '';

				const mdx = [
					'---',
					`title: ${escapeYaml(title)}`,
					`description: ${escapeYaml(`Release notes for ${title} (${date})`)}`,
					'editUrl: false',
					'---',
					'',
					`**Released:** ${date} · **Tag:** [\`${rel.tag_name}\`](${rel.html_url})`,
					'',
					escapeMdxBody(rel.body),
					'',
					assetsSection,
				].join('\n');

				await writeFile(path.join(repoDir, `${slugPart}.mdx`), mdx, 'utf8');
				groupSidebarItems.push({ label: rel.tag_name, slug });

				cards.push(
					renderCard({
						name: rel.tag_name,
						desc: 'Minimal portable multi-target LLVM (clang + lld + binutils) for all 6 host platforms.',
						badge: `release ${rel.tag_name}`,
						date,
						href: `/${slug}/`,
					}),
				);
			}
		}

		if (groupSidebarItems.length > 0) {
			sidebarGroups.push({
				label: group.repo,
				collapsed: true,
				items: groupSidebarItems,
			});
		}

		sections.push(
			[
				`<div class="xt-rel-section not-content">`,
				`  <div class="xt-rel-section-head">`,
				`    <h2>${escapeHtml(group.title)}</h2>`,
				`    <a class="xt-rel-repo" href="https://github.com/${ORG}/${group.repo}" target="_blank" rel="noopener noreferrer">${ORG}/${group.repo} ↗</a>`,
				`  </div>`,
				`  <div class="xt-rel-grid">`,
				...cards,
				`  </div>`,
				`</div>`,
			].join('\n'),
		);
	}

	const indexMdx = [
		'---',
		'title: Releases',
		'description: Latest crates and prebuilt toolchain releases across the cross-toolchains ecosystem.',
		'editUrl: false',
		'---',
		'',
		'Latest published crates and portable toolchain binaries synced from crates.io and GitHub Releases.',
		'',
		...sections,
		'',
	].join('\n');

	await writeFile(path.join(RELEASES_DIR, 'index.mdx'), indexMdx, 'utf8');
	await writeFile(SIDEBAR_JSON, `${JSON.stringify(sidebarGroups, null, 2)}\n`, 'utf8');
	console.log(`[sync-releases] Generated ${sections.length} sections and ${sidebarGroups.reduce((n, g) => n + g.items.length, 0)} release log pages.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
