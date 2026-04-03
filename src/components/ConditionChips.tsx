import React from 'react';
import type { ConditionSet } from '../types/conditions';
import './ConditionChips.css';

interface ConditionChipsProps {
  conditionSet: ConditionSet;
  onRemoveRule: (groupId: string, ruleId: string) => void;
  onAddOrGroup: () => void;
  onToggleGroupOperator: (groupId: string) => void;
}

const ConditionChips: React.FC<ConditionChipsProps> = ({ conditionSet, onRemoveRule, onAddOrGroup, onToggleGroupOperator }) => {
  const nonEmptyGroups = conditionSet.groups.filter(g => g.rules.length > 0);

  if (nonEmptyGroups.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', padding: '16px 0' }}>
        Nenhuma condição adicionada
      </div>
    );
  }

  return (
    <div className="chips-container">
      {nonEmptyGroups.map((group, gi) => (
        <React.Fragment key={group.id}>
          {gi > 0 && (
            <div className="group-divider">
              <div className="divider-line" />
              <span className="divider-label">E</span>
              <div className="divider-line" />
            </div>
          )}
          <div className="condition-group">
            {group.rules.map((rule, ri) => (
              <React.Fragment key={rule.id}>
                {ri > 0 && (
                  <button
                    className="logic-operator"
                    onClick={() => onToggleGroupOperator(group.id)}
                    title="Toque para alternar E/OU"
                  >
                    {group.operator === 'OR' ? 'OU' : 'E'}
                  </button>
                )}
                <div className="condition-chip">
                  <span className="chip-label">{rule.label}</span>
                  <button className="chip-remove" onClick={() => onRemoveRule(group.id, rule.id)}>
                    ×
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        </React.Fragment>
      ))}
      <button className="or-group-btn" onClick={onAddOrGroup}>
        + Criar grupo OU
      </button>
    </div>
  );
};

export default ConditionChips;
