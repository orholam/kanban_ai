import { ArrowRight, Plug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { documentationBoardArticlePath } from '../documentation-board-feature/integration'
import { MCP_DOCS_SLUG } from '../lib/mcpSetup'

interface McpHeroInlineProps {
  isDarkMode: boolean
  align?: 'center' | 'start'
}

/** Slim hero tag — stacks on mobile, single row from sm up. */
export function McpHeroInline({ isDarkMode, align = 'center' }: McpHeroInlineProps) {
  const pillInner = isDarkMode
    ? 'bg-zinc-900/95 text-zinc-200 backdrop-blur-sm'
    : 'bg-white/95 text-zinc-800 backdrop-blur-sm'

  const borderGradient = isDarkMode
    ? 'bg-gradient-to-r from-indigo-500/50 via-violet-500/45 to-indigo-400/50 ring-white/[0.06]'
    : 'bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-100 ring-black/[0.04]'

  const setupLinkClass = `inline-flex shrink-0 items-center gap-0.5 font-semibold transition ${
    isDarkMode
      ? 'text-indigo-400 hover:text-indigo-300'
      : 'text-indigo-600 hover:text-indigo-500'
  }`

  return (
    <div className={`mt-4 sm:mt-5 flex w-full ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      <div className={`w-full max-w-md sm:max-w-none sm:w-auto rounded-2xl sm:rounded-full p-px shadow-sm ring-1 ${borderGradient}`}>
        {/* Mobile: stacked layout */}
        <div className={`flex flex-col gap-2 px-3.5 py-2.5 text-xs sm:hidden ${pillInner} rounded-2xl`}>
          <div className="flex items-center gap-2">
            <Plug
              className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
              aria-hidden
            />
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? 'bg-indigo-500/25 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              New
            </span>
            <span className="font-medium">MCP · Claude · Cursor</span>
          </div>
          <div className="flex items-center justify-between gap-2 pl-5">
            <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
              Run your board from chat
            </span>
            <Link to={documentationBoardArticlePath(MCP_DOCS_SLUG)} className={setupLinkClass}>
              Setup
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* sm+: single-row pill */}
        <div
          className={`hidden sm:inline-flex h-11 max-w-full items-center gap-x-2.5 rounded-full px-3.5 text-sm ${pillInner}`}
        >
          <Plug
            className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
            aria-hidden
          />
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'bg-indigo-500/25 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            New
          </span>
          <span className="whitespace-nowrap font-medium">MCP · Claude · Cursor</span>
          <span className={`truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Run your board from chat
          </span>
          <Link to={documentationBoardArticlePath(MCP_DOCS_SLUG)} className={setupLinkClass}>
            Setup
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
