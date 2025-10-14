// features/common/components/DemoWatermark.tsx
export default function DemoWatermark() {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          pointerEvents: 'none',
          opacity: 0.10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '7vw',
          transform: 'rotate(-25deg)',
          color: '#FF6F61',
          fontWeight: 900,
          userSelect: 'none',
          letterSpacing: '0.1em',
        }}
      >
        DEMO-INHALTE
      </div>
    );
  }
  