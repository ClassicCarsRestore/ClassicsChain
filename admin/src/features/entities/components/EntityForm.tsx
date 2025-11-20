import { useState, useEffect } from 'react';
import { useCreateEntity, useUpdateEntity } from '../hooks/useEntities';
import { EntityType, type Entity, type CreateEntityDto, type Address } from '../types';

interface EntityFormProps {
  entity?: Entity;
  fixedEntityType?: EntityType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityForm({ entity, fixedEntityType, onSuccess, onCancel }: EntityFormProps) {
  const [name, setName] = useState(entity?.name || '');
  const [type, setType] = useState<EntityType>(entity?.type || fixedEntityType || EntityType.Certifier);
  const [description, setDescription] = useState(entity?.description || '');
  const [contactEmail, setContactEmail] = useState(entity?.contactEmail || '');
  const [website, setWebsite] = useState(entity?.website || '');
  const [street, setStreet] = useState(entity?.address?.street || '');
  const [city, setCity] = useState(entity?.address?.city || '');
  const [state, setState] = useState(entity?.address?.state || '');
  const [postalCode, setPostalCode] = useState(entity?.address?.postalCode || '');
  const [country, setCountry] = useState(entity?.address?.country || '');
  const [error, setError] = useState('');

  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();

  const isEdit = !!entity;

  useEffect(() => {
    if (createEntity.isSuccess || updateEntity.isSuccess) {
      onSuccess?.();
    }
  }, [createEntity.isSuccess, updateEntity.isSuccess, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError('Invalid email address');
      return;
    }

    // Address is optional, but if any field is provided, city and country are required
    let address: Address | undefined = undefined;
    if (street || city || state || postalCode || country) {
      if (!city.trim()) {
        setError('City is required when providing address');
        return;
      }
      if (!country.trim()) {
        setError('Country is required when providing address');
        return;
      }

      address = {
        street: street || undefined,
        city,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country,
      };
    }

    if (isEdit) {
      await updateEntity.mutateAsync({
        id: entity.id,
        data: {
          name,
          description: description || undefined,
          contactEmail,
          website: website || undefined,
          address,
        },
      });
    } else {
      const data: CreateEntityDto = {
        name,
        type,
        description: description || undefined,
        contactEmail,
        website: website || undefined,
        address,
      };

      await createEntity.mutateAsync(data);
    }
  };

  const isSubmitting = createEntity.isPending || updateEntity.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {createEntity.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {createEntity.error.message}
        </div>
      )}

      {updateEntity.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {updateEntity.error.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {!isEdit && !fixedEntityType && (
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as EntityType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={EntityType.Certifier}>Certifier</option>
            <option value={EntityType.Partner}>Partner</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Email *
        </label>
        <input
          type="email"
          id="contactEmail"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Website
        </label>
        <input
          type="text"
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Address (Optional)</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              Street
            </label>
            <input
              type="text"
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City {(street || state || postalCode || country) && '*'}
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country {(street || city || state || postalCode) && '*'}
              </label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Entity' : 'Create Entity'}
        </button>
      </div>
    </form>
  );
}
