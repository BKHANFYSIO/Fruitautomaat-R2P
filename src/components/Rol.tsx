import { useSpring, animated } from 'react-spring';
import { useEffect, useState } from 'react';
import './Rol.css';

// Nieuw type voor de items in de rol
type RolItem = { symbool?: string; img?: string; className?: string };

interface RolProps {
  items: (string | RolItem)[];
  stopAt: number;
  isSpinning: boolean;
  className?: string;
  height?: number;
  isWinnend?: boolean;
}

const Rol = ({ items, stopAt, isSpinning, className, height = 70, isWinnend }: RolProps) => {
  const [offset, setOffset] = useState(0);

  const itemHeight = height; // Gebruik de prop, met 70 als standaardwaarde

  // Deze spring animeert de 'transform' property van de rol
  const { transform } = useSpring({
    transform: `translateY(${offset}px)`,
    config: { tension: 120, friction: 14 },
  });

  useEffect(() => {
    if (isSpinning) {
      // Begin de animatie door een willekeurige hoge offset in te stellen
      const randomStart = Math.floor(Math.random() * items.length);
      const startOffset = -randomStart * itemHeight;
      setOffset(startOffset - items.length * itemHeight * 5); // Draai een paar keer extra
    } else {
      // Stop de animatie op de juiste index
      const targetOffset = -stopAt * itemHeight;
      setOffset(targetOffset);
    }
  }, [isSpinning, stopAt, items.length, itemHeight]); // itemHeight hier toevoegen als dependency

  // We renderen de lijst meerdere keren om een oneindig effect te creëren
  const extendedItems = [...items, ...items, ...items];

  return (
    <div className={`rol-viewport ${className || ''} ${isWinnend ? 'winnend' : ''}`} style={{ height: `${itemHeight}px` }}>
      <animated.div className="rol-inner" style={{ transform }}>
        {extendedItems.map((item, index) => {
          const itemContent = typeof item === 'string' ? { symbool: item } : item;
          return (
            <div key={index} className={`rol-item ${itemContent.className || ''}`} style={{ height: `${itemHeight}px` }}>
              {itemContent.img ? (
                <img src={itemContent.img} alt="rol-item" className="rol-image" />
              ) : (
                itemContent.symbool
              )}
            </div>
          );
        })}
      </animated.div>
    </div>
  );
};

export default Rol; 