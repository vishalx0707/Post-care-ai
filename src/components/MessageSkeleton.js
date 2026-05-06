export default function MessageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
      <div className="skeleton" style={{ width: '60%', height: 40, alignSelf: 'flex-start' }} />
      <div className="skeleton" style={{ width: '45%', height: 32, alignSelf: 'flex-end' }} />
      <div className="skeleton" style={{ width: '70%', height: 56, alignSelf: 'flex-start' }} />
    </div>
  );
}
