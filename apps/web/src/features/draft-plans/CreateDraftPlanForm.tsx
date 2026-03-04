import { useState, type FormEvent } from 'react';
import type { CreateDraftPlanPayload } from '@draft-plans/shared';
import { CloseIcon } from '@/components/Icons';

type CreateDraftPlanFormProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDraftPlanPayload) => Promise<unknown> | void;
};

export function CreateDraftPlanForm({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateDraftPlanFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = name.trim();
    const nextDescription = description.trim();

    if (!nextName) {
      return;
    }

    await onSubmit({
      name: nextName,
      description: nextDescription || undefined,
    });

    setName('');
    setDescription('');
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        aria-label="Create draft plan"
        className="create-plan-modal"
        data-testid="create-draft-plan-form"
        onSubmit={handleSubmit}
      >
        <div className="modal-top-row">
          <div>
            <h2>New Draft Plan</h2>
            <p>Give your strategy a short name and optional description.</p>
          </div>
          <button
            aria-label="Close create draft plan modal"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aggressive Tri-Lane"
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Focus on early aggression with strong lane dominators."
            maxLength={500}
            rows={4}
          />
        </label>
        <div className="modal-action-row">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-button"
            data-testid="submit-create-draft-plan-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating...' : 'Create draft plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
