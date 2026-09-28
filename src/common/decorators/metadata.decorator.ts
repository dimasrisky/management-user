import 'reflect-metadata';

export function Relation() {
  return (target: object, propertyKey: string) => {
    const relations: string[] =
      (Reflect.getMetadata('relations', target) as string[] | undefined) ?? [];
    Reflect.defineMetadata('relations', [...relations, propertyKey], target);
  };
}
