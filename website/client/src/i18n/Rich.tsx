import { Fragment, type ReactNode } from 'react';

// Tərcümədə söz sırası dillərə görə dəyişir, ona görə vurğu və link mətnin içində işarələnir:
//   <b>   → {b} qalın; <b>mətn</b> → qalın mətn; <a>mətn</a> → a(mətn) (məs. <Link>).
export function Rich({ text, b, a }: { text: string; b?: ReactNode; a?: (children: string) => ReactNode }) {
  const parts = text.split(/(<b>.*?<\/b>|<a>.*?<\/a>|<b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p === '<b>') return <strong key={i}>{b}</strong>;
        if (p.startsWith('<b>')) return <strong key={i}>{p.slice(3, -4)}</strong>;
        if (p.startsWith('<a>')) return <Fragment key={i}>{a ? a(p.slice(3, -4)) : p.slice(3, -4)}</Fragment>;
        return p;
      })}
    </>
  );
}
