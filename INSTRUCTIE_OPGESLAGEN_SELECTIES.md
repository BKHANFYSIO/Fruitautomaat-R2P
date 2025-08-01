# Instructie: Opgeslagen Selecties Functionaliteit Toevoegen

Deze instructie beschrijft hoe je dezelfde opgeslagen selecties functionaliteit kunt toevoegen aan de multiplayer modus en vrije leermodus tabs, gebaseerd op de implementatie in de Leitner component.

## 1. TypeScript/React Wijzigingen

### 1.1 Toast Melding Component Toevoegen
Voeg deze component toe aan het begin van je bestand (na de imports):

```typescript
// Toast melding component
const ToastMelding = ({ bericht, isZichtbaar, onClose }: { bericht: string; isZichtbaar: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isZichtbaar) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isZichtbaar, onClose]);

  return (
    <div className={`toast-melding ${isZichtbaar ? 'zichtbaar' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">✅</span>
        <span className="toast-bericht">{bericht}</span>
      </div>
    </div>
  );
};
```

### 1.2 State Toevoegen
Voeg deze state variabelen toe aan je component:

```typescript
const [toastBericht, setToastBericht] = useState('');
const [isToastZichtbaar, setIsToastZichtbaar] = useState(false);
```

### 1.3 Opgeslagen Selecties Sectie Aanpassen
Vervang de bestaande opgeslagen selecties sectie met:

```typescript
{/* Opgeslagen selecties sectie */}
<div className="opgeslagen-selecties-sectie">
  <h4>📚 Opgeslagen Selecties</h4>
  {opgeslagenSelecties.length > 0 ? (
    <div className="opgeslagen-selecties-lijst">
      {opgeslagenSelecties.map(selectie => (
        <div key={selectie.id} className="opgeslagen-selectie-item">
          <div className="selectie-info">
            <span className="selectie-naam">{selectie.naam}</span>
            <span className="selectie-datum">
              {new Date(selectie.datum).toLocaleDateString()}
            </span>
            <span className="selectie-aantal">
              {selectie.categorieen.length} categorieën
            </span>
          </div>
          <div className="selectie-acties">
            <button 
              onClick={() => handleLaadSelectie(selectie)}
              className="laad-selectie-knop"
              title="Herstel deze selectie"
            >
              🔄
            </button>
            <button 
              onClick={() => handleVerwijderSelectie(selectie.id)}
              className="verwijder-selectie-knop"
              title="Verwijder deze selectie"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="geen-selecties-melding">
      <p>Nog geen selecties opgeslagen. Maak een selectie en klik op de 'Huidige Selectie Opslaan' knop.</p>
    </div>
  )}
</div>
```

### 1.4 Opslaan Knop Aanpassen
Vervang de bestaande opslaan knop met:

```typescript
{/* Opslaan knop sectie */}
{opgeslagenSelecties.length < 5 && (
  <div className="opslaan-sectie">
    <button 
      onClick={handleOpslaanSelectie}
      disabled={geselecteerdeCategorieen.length === 0}
      className="opslaan-selectie-knop"
    >
      💾 Huidige Selectie Opslaan
    </button>
  </div>
)}
```

### 1.5 Toast Melding Toevoegen
Voeg deze regel toe aan het einde van je component (voor de sluitende div):

```typescript
{toastBericht && <ToastMelding bericht={toastBericht} isZichtbaar={isToastZichtbaar} onClose={() => setIsToastZichtbaar(false)} />}
```

### 1.6 Functies Aanpassen
Vervang de bestaande functies met deze versies die toast meldingen gebruiken:

```typescript
const handleOpslaanSelectie = () => {
  const maxSelecties = 5;
  const huidigeSelecties = activeTab === 'multiplayer' ? opgeslagenSelecties : opgeslagenVrijeLeermodusSelecties;
  
  if (huidigeSelecties.length >= maxSelecties) {
    setToastBericht('Je kunt maximaal 5 opgeslagen selecties hebben. Verwijder eerst een oude selectie.');
    setIsToastZichtbaar(true);
    return;
  }
  setToonOpslaanModal(true);
};

const handleBevestigOpslaan = () => {
  if (!nieuweSelectieNaam.trim()) {
    setToastBericht('Geef een naam op voor je selectie.');
    setIsToastZichtbaar(true);
    return;
  }

  const nieuweSelectie: OpgeslagenCategorieSelectie = {
    id: Date.now().toString(),
    naam: nieuweSelectieNaam.trim(),
    categorieen: [...actieveCategorieSelectie],
    datum: new Date().toISOString()
  };

  const nieuweSelecties = [...huidigeSelecties, nieuweSelectie];
  setHuidigeSelecties(nieuweSelecties);
  localStorage.setItem(localStorageKey, JSON.stringify(nieuweSelecties));
  
  setNieuweSelectieNaam('');
  setToonOpslaanModal(false);
  setToastBericht('Selectie opgeslagen!');
  setIsToastZichtbaar(true);
};

const handleLaadSelectie = (selectie: OpgeslagenCategorieSelectie) => {
  setActieveCategorieSelectie([...selectie.categorieen]);
  setToastBericht(`Selectie "${selectie.naam}" is geladen!`);
  setIsToastZichtbaar(true);
};

const handleVerwijderSelectie = (id: string) => {
  const nieuweSelecties = huidigeSelecties.filter(s => s.id !== id);
  setHuidigeSelecties(nieuweSelecties);
  localStorage.setItem(localStorageKey, JSON.stringify(nieuweSelecties));
  setToastBericht('Selectie verwijderd!');
  setIsToastZichtbaar(true);
};
```

## 2. CSS Wijzigingen

### 2.1 Toast Melding Styling Toevoegen
Voeg deze CSS toe aan je CSS bestand:

```css
/* Toast melding styling */
.toast-melding {
  position: fixed;
  top: 80px;
  right: -400px;
  width: 350px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(52, 144, 220, 0.3);
  z-index: 1000;
  transition: right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.15);
  will-change: right;
}

.toast-melding.zichtbaar {
  right: 20px;
}

.toast-content {
  padding: 16px 20px;
  background: linear-gradient(140deg, #10B981, #059669);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.toast-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.toast-bericht {
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Responsive design voor toast */
@media (max-width: 768px) {
  .toast-melding {
    width: calc(100vw - 30px);
    right: -100vw;
  }
  
  .toast-melding.zichtbaar {
    right: 15px;
  }
  
  .toast-content {
    padding: 14px 16px;
  }
}
```

### 2.2 Geen Selecties Melding Styling
Voeg deze CSS toe voor de melding wanneer er geen opgeslagen selecties zijn:

```css
.geen-selecties-melding {
  padding: 20px;
  text-align: center;
  color: #888;
  font-style: italic;
  background-color: #2a2d35;
  border-radius: 6px;
  border: 1px dashed #555;
}

.geen-selecties-melding p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}
```

### 2.3 Opslaan Knop Styling Aanpassen
Zorg ervoor dat de opslaan knop niet de volledige breedte inneemt door `width: 100%` te verwijderen:

```css
.opslaan-selectie-knop {
  background-color: #61dafb;
  color: #282c34;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s, transform 0.1s;
  font-size: 0.9rem;
  /* Verwijder width: 100% als dat er staat */
}
```

## 3. Belangrijke Punten

1. **Titel aanpassen**: Verander "📚 Opgeslagen Leitner Selecties" naar "📚 Opgeslagen Selecties" voor de algemene tabs
2. **LocalStorage keys**: Zorg ervoor dat je de juiste localStorage keys gebruikt voor elke tab
3. **State variabelen**: Pas de variabelen aan naar de juiste namen voor jouw component
4. **Import useEffect**: Zorg ervoor dat `useEffect` geïmporteerd is als je het nog niet gebruikt

## 4. Test Checklist

- [ ] Titel is altijd zichtbaar, ook zonder opgeslagen selecties
- [ ] Melding verschijnt wanneer er geen selecties zijn
- [ ] Toast melding schuift van rechts in bij het laden van een selectie
- [ ] Toast melding verdwijnt automatisch na 3 seconden
- [ ] Opslaan knop heeft dezelfde styling als andere knoppen
- [ ] Herstel icoontje (🔄) werkt correct
- [ ] Alle meldingen gebruiken toast in plaats van alert
- [ ] Responsive design werkt op mobiel

Deze instructie zorgt ervoor dat je dezelfde consistente ervaring krijgt in alle tabs van de categorie selectie modal! 