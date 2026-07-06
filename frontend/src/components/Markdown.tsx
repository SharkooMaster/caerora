import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/**
 * Renders trusted CMS/Studio-authored markdown (product descriptions etc.)
 * with the storefront's typography. remark-breaks keeps existing plain-text
 * content readable by treating single newlines as line breaks.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => <h3 className="mb-2 mt-5 font-serif text-xl text-espresso first:mt-0">{children}</h3>,
        h2: ({ children }) => <h3 className="mb-2 mt-5 font-serif text-lg text-espresso first:mt-0">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-1.5 mt-4 text-sm font-semibold text-espresso first:mt-0">{children}</h4>,
        p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-espresso">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} className="text-plum underline underline-offset-2 hover:text-rose">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-rose/40 pl-4 italic text-taupe">{children}</blockquote>
        ),
        hr: () => <hr className="my-4 border-taupe/15" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
