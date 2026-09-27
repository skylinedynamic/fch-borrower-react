// Summernote (legacy jQuery-era library, see CLAUDE.md) extends jQuery.fn
// with a `.summernote()` plugin method that @types/jquery has no knowledge
// of; there is no official @types package for summernote itself.
declare global {
  interface Window {
    $?: JQueryStatic
    jQuery?: JQueryStatic
  }

  interface JQuery {
    summernote?(...args: unknown[]): unknown
  }

}

// <lord-icon> is the Lordicon web component (loaded via a <script> tag, no
// React wrapper/`@types` package exists) used across modal components for
// animated icons. With `jsx: "react-jsx"`, `JSX.IntrinsicElements` resolves
// through the `react` module's exported JSX namespace, so it must be
// augmented here rather than via a `declare global { namespace JSX }` block.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          trigger?: string
          colors?: string
          delay?: string | number
        },
        HTMLElement
      >
    }
  }
}

export {}
