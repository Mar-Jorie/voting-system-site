// Pointer utility functions for database relationships

export const createPointer = (className, objectId) => {
  return {
    __type: 'Pointer',
    className: className,
    objectId: objectId
  };
};

export const isPointer = (obj) => {
  return obj && obj.__type === 'Pointer';
};

export const getPointerId = (pointer) => {
  if (isPointer(pointer)) {
    return pointer.objectId;
  }
  return null;
};

export const getPointerClass = (pointer) => {
  if (isPointer(pointer)) {
    return pointer.className;
  }
  return null;
};

export const createRelation = (className, objectIds = []) => {
  return {
    __type: 'Relation',
    className: className,
    objects: objectIds.map(id => createPointer(className, id))
  };
};

export const isRelation = (obj) => {
  return obj && obj.__type === 'Relation';
};

export const getRelationIds = (relation) => {
  if (isRelation(relation)) {
    return relation.objects.map(obj => obj.objectId);
  }
  return [];
};
