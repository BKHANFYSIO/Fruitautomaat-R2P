interface CategorieFilterProps {
  categorieen: string[];
  geselecteerdeCategorieen: string[];
  onCategorieSelectie: (categorie: string) => void;
  gameMode?: 'single' | 'multi';
  highScoreLibrary?: { [key: string]: { score: number; spelerNaam: string } };
  onHighScoreSelect?: (categories: string[]) => void;
}

export const CategorieFilter = ({
  categorieen,
  geselecteerdeCategorieen,
  onCategorieSelectie,
  gameMode,
  highScoreLibrary,
  onHighScoreSelect,
}: CategorieFilterProps) => {
  const handleHighScoreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    if (selectedKey && onHighScoreSelect) {
      const categories = selectedKey.split(',');
      onHighScoreSelect(categories);
    }
  };

  const handleSelectAll = () => {
    if (onHighScoreSelect) {
      onHighScoreSelect(categorieen);
    }
  };

  const handleDeselectAll = () => {
    if (onHighScoreSelect) {
      onHighScoreSelect([]);
    }
  };

  const highScoresExist = highScoreLibrary && Object.keys(highScoreLibrary).length > 0;

  return (
    <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h4>Selecteer Categorieën:</h4>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Standaard zijn alle categorieën aangevinkt. Je kunt specifieke categorieën aan- of uitvinken, of alle categorieën tegelijk selecteren/deselecteren.
      </p>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleSelectAll}
          style={{ 
            marginRight: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#38a169', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ✅ Selecteer alle categorieën
        </button>
        <button 
          onClick={handleDeselectAll}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#e53e3e', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ❌ Deselecteer alle categorieën
        </button>
      </div>
      
      {/* Recordpoging selector voor single player */}
      {gameMode === 'single' && highScoresExist && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <label htmlFor="highscore-select" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            <strong>Kies een eerdere recordpoging:</strong>
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Selecteer een eerdere recordpoging om dezelfde categorieën te laden die je toen gebruikte.
          </p>
          <select 
            id="highscore-select" 
            onChange={handleHighScoreSelect} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">-- Selecteer een combinatie --</option>
            {Object.entries(highScoreLibrary!).map(([key, value]) => (
              <option key={key} value={key}>
                {value.score.toFixed(1)} pnt door {value.spelerNaam} ({key.replace(/,/g, ', ')})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {categorieen.map((categorie) => (
        <label key={categorie} style={{ marginRight: '15px', display: 'inline-block' }}>
          <input
            type="checkbox"
            checked={geselecteerdeCategorieen.includes(categorie)}
            onChange={() => onCategorieSelectie(categorie)}
          />
          {categorie}
        </label>
      ))}
    </div>
  );
}; 