export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="steps">
      {items.map((item, i) => (
        <li key={i}>
          <span className="step-num">{i + 1}</span>
          <span className="step-text">{item}</span>
        </li>
      ))}
    </ol>
  )
}