import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'

const configDir = dirname(fileURLToPath(import.meta.url))
const docsDir = resolve(configDir, '..')
const sidebarOrder = ['charging', 'infotainment', 'maintenance', 'faq']

type SidebarPage = {
  relativeFilePath: string
  link: string
  text: string
  orderKeys: string[]
}

function getPageTitle(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const heading = content.match(/^#\s+(.+)$/m)

  return heading?.[1]?.trim() ?? basename(filePath, '.md')
}

function getRoutePath(relativeFilePath: string) {
  const routePath = relativeFilePath.replace(/\.md$/, '')

  if (routePath.endsWith('/index')) {
    return `/${routePath.slice(0, -'/index'.length)}/`
  }

  return `/${routePath}`
}

function getOrderKeys(relativeFilePath: string) {
  const routePath = relativeFilePath.replace(/\.md$/, '')
  const segments = routePath.split('/')
  const keys = [routePath, segments[segments.length - 1]]

  if (routePath.endsWith('/index')) {
    keys.unshift(routePath.slice(0, -'/index'.length))
  }

  if (segments.length === 2 && segments[0] === segments[1]) {
    keys.unshift(segments[0])
  }

  return [...new Set(keys)]
}

function getMarkdownFiles() {
  return readdirSync(docsDir, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isFile()) {
        if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
          return [entry.name]
        }

        return []
      }

      if (!entry.isDirectory() || entry.name === '.vitepress') {
        return []
      }

      return readdirSync(resolve(docsDir, entry.name), { withFileTypes: true })
        .filter((childEntry) => childEntry.isFile() && childEntry.name.endsWith('.md'))
        .map((childEntry) => `${entry.name}/${childEntry.name}`)
    })
}

function getSidebarItems(): DefaultTheme.SidebarItem[] {
  const pages: SidebarPage[] = getMarkdownFiles()
    .map((relativeFilePath) => {
      const filePath = resolve(docsDir, relativeFilePath)

      return {
        relativeFilePath,
        link: getRoutePath(relativeFilePath),
        text: getPageTitle(filePath),
        orderKeys: getOrderKeys(relativeFilePath)
      }
    })

  const selectedPaths = new Set<string>()
  const orderedPages = sidebarOrder
    .flatMap((orderKey) => pages.filter((page) => page.orderKeys.includes(orderKey)))
    .filter((page) => {
      if (selectedPaths.has(page.relativeFilePath)) {
        return false
      }

      selectedPaths.add(page.relativeFilePath)
      return true
    })

  const remainingPages = pages
    .filter((page) => !selectedPaths.has(page.relativeFilePath))
    .sort((left, right) => left.relativeFilePath.localeCompare(right.relativeFilePath, 'zh-CN'))

  const items = [...orderedPages, ...remainingPages]
    .map((page) => ({
      text: page.text,
      link: page.link
    }))

  return [
    {
      text: '目录',
      items: [
        { text: '首页', link: '/' },
        ...items
      ]
    }
  ]
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'IONIQ 5 N China Owner Wiki',
  description: 'IONIQ 5 N 中国车主 Wiki',
  appearance: false,
  cleanUrls: true,
  ignoreDeadLinks: ['/manual/vehicle_i5n.rcz'],
  themeConfig: {
    sidebar: getSidebarItems(),
    /* socialLinks: [
      { icon: 'github', link: 'https://github.com/AntaresCorn/ioniq_5n_china_owner_wiki' }
    ] */
  }
})
