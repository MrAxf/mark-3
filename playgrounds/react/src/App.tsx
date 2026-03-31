import { createAddClassesPlugin } from '@mark-sorcery/plugin-add-classes'
import { createMarkSorceryRehypePlugin, Markdown } from '@mark-sorcery/react'
import rehypeShiki from '@shikijs/rehype'

const markdown = `# Mark Sorcery React\n\nEste playground consume **@mark-sorcery/react** desde workspaces.\n\n- Lista uno\n- Lista dos\n\n\`\`\`ts\nconst hello = 'world'\nconsole.log(hello)\n\`\`\`\n---\n\n> Blockquote\n\n[Enlace a Mark Sorcery](https://mark-sorcery.dev)`

export default function App() {
  return (
    <main className="app-shell">
      <header>
        <h1>Playground React</h1>
      </header>

      <section className="content">
        <Markdown
          markdown={markdown}
          options={{ sanitize: false }}
          components={{
            span:
              ({ children, ...props }) => <span {...props}>{children}</span>
          }}
          plugins={[
            createAddClassesPlugin({
              elements: {
                h1: 'main-heading',
                pre: 'code-block',
              },
            }),
            createMarkSorceryRehypePlugin([
              rehypeShiki, {
                themes: {
                  light: 'vitesse-light',
                  dark: 'vitesse-dark',
                }
              }
            ])
          ]}
        />
      </section>
    </main>
  )
}
