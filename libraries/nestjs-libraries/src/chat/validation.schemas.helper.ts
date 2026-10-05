import {
  validationMetadatasToSchemas,
  targetConstructorToSchema,
} from 'class-validator-jsonschema';
import { defaultConverters } from 'class-validator-jsonschema/build/defaultConverters';
import { ValidationTypes } from 'class-validator';
// @ts-ignore
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';

export function getValidationSchemas() {
  return validationMetadatasToSchemas({
    classTransformerMetadataStorage: defaultMetadataStorage,
    additionalConverters: {
      // Each schema is used on its own, without the shared definitions, so a $ref
      // would point nowhere (and Gemini rejects tool results that contain one)
      [ValidationTypes.CUSTOM_VALIDATION]: (meta, options) => {
        const converter = defaultConverters[ValidationTypes.CUSTOM_VALIDATION];
        const schema: any = {
          ...(typeof converter === 'function'
            ? converter(meta, options)
            : converter),
        };
        delete schema.$ref;
        return schema;
      },
      [ValidationTypes.NESTED_VALIDATION]: (meta, options) => {
        if (typeof meta.target === 'function') {
          const typeMeta = options.classTransformerMetadataStorage
            ? options.classTransformerMetadataStorage.findTypeMetadata(
                meta.target,
                meta.propertyName
              )
            : null;
          if (typeMeta) {
            const childType = typeMeta.typeFunction();
            return targetConstructorToSchema(childType, options);
          }
        }
        return {};
      },
    },
  });
}
