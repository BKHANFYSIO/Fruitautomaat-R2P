import { Modal } from './Modal';
import { CRITERIA } from '../data/criteria';
import './CriteriaModal.css';

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CriteriaModal = ({ isOpen, onClose }: CriteriaModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          Beoordelingscriteria
          <p className="criteria-intro">
            Dit zijn algemene criteria die je als richtlijn kunt gebruiken. Kies de criteria die relevant zijn voor de specifieke opdracht.
          </p>
        </>
      }
    >
      <div className="criteria-content">
        {Object.values(CRITERIA).map((categorie) => (
          <div className="criteria-sectie" key={categorie.titel}>
            <h4>{categorie.titel}</h4>
            <ul>
              {categorie.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}; 