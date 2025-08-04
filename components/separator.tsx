interface SeparatorProps {
  className?: string;
  color?: string;
  thickness?: 'thin' | 'medium' | 'thick';
  width?: 'full' | 'half' | 'quarter';
}

export default function Separator({ 
  className = '', 
  color = '#eaeaea', 
  thickness = 'thin'
}: SeparatorProps) {
  const thicknessMap = {
    thin: 'h-px',
    medium: 'h-0.5',
    thick: 'h-1'
  };


  return (
    <div>
        <div 
        className={`${thicknessMap[thickness]} ${className}`}
        style={{ 
            backgroundColor: color,
            opacity: 0.65,
        }}
        />
        {/* <div
         style={{ 
            aspectRatio: '1 / 1',
            bottom: '-4px',
            flex: '0 0 auto',
            left: '50%',
            overflow: 'visible',
            position: 'relative',
            top: '-5px',
            transform: 'translateX(-50%)',
            width: '9px',
            zIndex: 1,
        }}
        >
            <div 
                style={{ 
                    backgroundColor: '#1e1e1e',
                    borderRadius: '16px',
                    flex: '0 0 auto',
                    height: '9px',
                    left: '4px',
                    top: '0px',
                    width: '1px',
                    position: 'absolute',
                }}
            />
            <div 
                style={{ 
                    backgroundColor: '#1e1e1e',
                    borderRadius: '16px',
                    flex: '0 0 auto',
                    height: '9px',
                    left: '4px',
                    position: 'absolute',
                    width: '1px',
                    transform: 'rotate(90deg)',
                }}
            />

        </div> */}
    </div>

  );
}
