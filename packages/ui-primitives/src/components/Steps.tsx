export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="stl-ui-steps">{children}</ol>;
}

export function Step({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <li className="stl-ui-steps__step">
      <div className="stl-ui-steps__step-title">{title}</div>
      <div className="stl-ui-steps__step-content">{children}</div>
    </li>
  );
}
