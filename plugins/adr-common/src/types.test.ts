import { Entity } from '@backstage/catalog-model';
import {
  hasAdrAnnotation,
  getAdrLocation,
  ADR_LOCATION_ANNOTATION,
} from './types';

describe('ADR_LOCATION_ANNOTATION', () => {
  it('should have the correct annotation key', () => {
    expect(ADR_LOCATION_ANNOTATION).toBe('backstage.io/adr-location');
  });
});

describe('hasAdrAnnotation', () => {
  it('should return true when entity has ADR annotation', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {
          'backstage.io/adr-location': './docs/decisions',
        },
      },
    };

    expect(hasAdrAnnotation(entity)).toBe(true);
  });

  it('should return false when entity has no ADR annotation', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {
          'backstage.io/techdocs-ref': 'dir:.',
        },
      },
    };

    expect(hasAdrAnnotation(entity)).toBe(false);
  });

  it('should return false when entity has no annotations', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
      },
    };

    expect(hasAdrAnnotation(entity)).toBe(false);
  });

  it('should return false when annotation value is empty string', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {
          'backstage.io/adr-location': '',
        },
      },
    };

    expect(hasAdrAnnotation(entity)).toBe(false);
  });
});

describe('getAdrLocation', () => {
  it('should return the ADR location when annotation exists', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {
          'backstage.io/adr-location': './docs/decisions',
        },
      },
    };

    expect(getAdrLocation(entity)).toBe('./docs/decisions');
  });

  it('should return absolute URL when provided', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {
          'backstage.io/adr-location':
            'https://github.com/org/repo/tree/main/docs/adr',
        },
      },
    };

    expect(getAdrLocation(entity)).toBe(
      'https://github.com/org/repo/tree/main/docs/adr',
    );
  });

  it('should return undefined when annotation does not exist', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: {},
      },
    };

    expect(getAdrLocation(entity)).toBeUndefined();
  });

  it('should return undefined when no annotations object', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
      },
    };

    expect(getAdrLocation(entity)).toBeUndefined();
  });
});
