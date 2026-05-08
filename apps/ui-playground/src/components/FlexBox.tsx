export const FlexBox = ({
  children,
  direction = 'row',
}: {
  children: React.ReactNode;
  direction: 'row' | 'column';
}) => {
  return <div style={{ display: 'flex', gap: '8px', flexDirection: direction }}>{children}</div>;
};
