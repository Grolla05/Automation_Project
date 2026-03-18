import { z } from 'zod';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const VALID_TYPES = [...VALID_IMAGE_TYPES, 'application/pdf'];

const isExcelFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'xlsx' || ext === 'xls';
};

export const createUploadSchema = (sessionData: { tests: string[]; testType?: string }) => {
  const isASE = sessionData.testType === 'ASE';
  const isTeste2 = sessionData.tests.includes('TESTE2');
  const REQUIRED_FILES_TESTE2 = ['image_test2.1', 'image_test2.2'];

  return z.object({
    files: z
      .array(z.instanceof(File))
      .min(1, 'Pelo menos um arquivo deve ser selecionado')
      .superRefine((files, ctx) => {
        // --- VALIDAÇÕES DE TAMANHO E FORMATO (ERROS IMEDIATOS) ---
        files.forEach((file) => {
          if (file.size > MAX_FILE_SIZE) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `O arquivo ${file.name} excede o limite de 50MB`,
            });
          }

          const isSupported = VALID_TYPES.includes(file.type) || isExcelFile(file);
          if (!isSupported) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Formato inválido: ${file.name}. Use apenas PDF, PNG, JPG ou Excel.`,
            });
          }
        });
      }),
  });
};

export type UploadFormData = z.infer<ReturnType<typeof createUploadSchema>>;
