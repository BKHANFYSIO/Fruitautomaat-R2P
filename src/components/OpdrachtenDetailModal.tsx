import React, { useState, useMemo } from 'react';
import './OpdrachtenDetailModal.css';
import { opdrachtTypeIconen } from '../data/constants';

type OpdrachtDetailKeys = keyof OpdrachtDetail;

interface OpdrachtDetail {
  opdracht: string;
  antwoord: string;
  bron: 'systeem' | 'gebruiker';
  opdrachtType?: string;
  box?: number;
  status?: 'actief' | 'gepauzeerd';
  volgendeHerhaling?: string;
  pogingen?: number;
  succesPercentage?: number;
}

interface OpdrachtenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorieNaam: string;
  opdrachten: OpdrachtDetail[];
  geselecteerdeOpdrachten?: string[];
  onOpdrachtSelectie?: (opdrachtTekst: string, isGeselecteerd: boolean) => void;
}

export const OpdrachtenDetailModal: React.FC<OpdrachtenDetailModalProps> = ({
  isOpen,
  onClose,
  categorieNaam,
  opdrachten,
  geselecteerdeOpdrachten = [],
  onOpdrachtSelectie,
}) => {
  const [zichtbareAntwoorden, setZichtbareAntwoorden] = useState<string[]>([]);
  const [zoekterm, setZoekterm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: OpdrachtDetailKeys; direction: 'ascending' | 'descending' } | null>(null);

  const gesorteerdeEnGefilterdeOpdrachten = useMemo(() => {
    let filterbareOpdrachten = [...opdrachten];

    if (zoekterm) {
      filterbareOpdrachten = filterbareOpdrachten.filter(opdracht =>
        opdracht.opdracht.toLowerCase().includes(zoekterm.toLowerCase()) ||
        (opdracht.antwoord && opdracht.antwoord.toLowerCase().includes(zoekterm.toLowerCase()))
      );
    }

    if (sortConfig !== null) {
      filterbareOpdrachten.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filterbareOpdrachten;
  }, [opdrachten, zoekterm, sortConfig]);

  const requestSort = (key: OpdrachtDetailKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: OpdrachtDetailKeys) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return ' ↕';
  };

  const toggleAntwoord = (opdrachtTekst: string) => {
    setZichtbareAntwoorden(prev => 
      prev.includes(opdrachtTekst) ? prev.filter(o => o !== opdrachtTekst) : [...prev, opdrachtTekst]
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content opdrachten-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>OPDRACHTEN IN "{categorieNaam}"</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="zoekbalk-container">
            <input
              type="text"
              placeholder="Zoek in opdrachten..."
              className="zoekbalk-input"
              value={zoekterm}
              onChange={(e) => setZoekterm(e.target.value)}
            />
          </div>
          <table className="opdrachten-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>Selectie</th>
                <th onClick={() => requestSort('opdracht')} style={{ cursor: 'pointer' }}>Opdracht{getSortIndicator('opdracht')}</th>
                <th onClick={() => requestSort('antwoord')} style={{ cursor: 'pointer' }}>Antwoord{getSortIndicator('antwoord')}</th>
                <th onClick={() => requestSort('bron')} style={{ cursor: 'pointer' }}>Bron{getSortIndicator('bron')}</th>
                <th onClick={() => requestSort('opdrachtType')} style={{ cursor: 'pointer' }}>Type{getSortIndicator('opdrachtType')}</th>
                <th onClick={() => requestSort('box')} style={{ cursor: 'pointer' }}>Box{getSortIndicator('box')}</th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status{getSortIndicator('status')}</th>
                <th onClick={() => requestSort('volgendeHerhaling')} style={{ cursor: 'pointer' }}>Volgende Herhaling{getSortIndicator('volgendeHerhaling')}</th>
                <th onClick={() => requestSort('pogingen')} style={{ cursor: 'pointer' }}>Pogingen{getSortIndicator('pogingen')}</th>
                <th onClick={() => requestSort('succesPercentage')} style={{ cursor: 'pointer' }}>Succes %{getSortIndicator('succesPercentage')}</th>
              </tr>
            </thead>
            <tbody>
              {gesorteerdeEnGefilterdeOpdrachten.map((opdracht) => (
                <tr key={opdracht.opdracht}>
                  <td className="selectie-kolom">
                    <input
                      type="checkbox"
                      checked={geselecteerdeOpdrachten.includes(opdracht.opdracht)}
                      onChange={() => {}} // Geen actie - alleen weergave
                      title={geselecteerdeOpdrachten.includes(opdracht.opdracht) 
                        ? "Deze opdracht is geselecteerd op basis van categorie/filter selectie" 
                        : "Deze opdracht is NIET geselecteerd op basis van categorie/filter selectie"}
                      disabled={true}
                    />
                  </td>
                  <td className="opdracht-kolom">{opdracht.opdracht}</td>
                  <td className="antwoord-kolom">
                    {zichtbareAntwoorden.includes(opdracht.opdracht) ? (
                      <>
                        <div className="antwoord-tekst">
                          {opdracht.antwoord || <div className="geen-antwoord">Deze opdracht heeft geen opgegeven antwoordsleutel. Zoek zelf naar bronnen om je eigen antwoord te controleren.</div>}
                        </div>
                        <button 
                          className="antwoord-toggle-knop verberg" 
                          onClick={() => toggleAntwoord(opdracht.opdracht)}
                        >
                          Verberg antwoord
                        </button>
                      </>
                    ) : (
                      <button 
                        className="antwoord-toggle-knop" 
                        onClick={() => toggleAntwoord(opdracht.opdracht)}
                      >
                        Toon antwoord
                      </button>
                    )}
                  </td>
                  <td className="bron-kolom">
                    <span 
                      className="bron-icon" 
                      title={opdracht.bron === 'systeem' ? 'Systeem opdracht' : 'Eigen opdracht'}
                    >
                      {opdracht.bron === 'systeem' ? '🏛️' : '👤'}
                    </span>
                  </td>
                  <td className="type-kolom">
                    <span 
                      className="type-icon" 
                      title={opdracht.opdrachtType || 'Onbekend type'}
                    >
                      {opdracht.opdrachtType ? opdrachtTypeIconen[opdracht.opdrachtType] || '❓' : '❓'}
                    </span>
                  </td>
                  <td className="box-kolom">{opdracht.box ?? '-'}</td>
                  <td className="status-kolom">
                    <span className={`status-badge ${opdracht.status ?? 'actief'}`}>
                      {opdracht.status ?? 'actief'}
                    </span>
                  </td>
                  <td className="herhaling-kolom">{opdracht.volgendeHerhaling ?? '-'}</td>
                  <td className="pogingen-kolom">{opdracht.pogingen ?? '-'}</td>
                  <td className="succes-kolom">{opdracht.succesPercentage !== undefined ? `${opdracht.succesPercentage}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
