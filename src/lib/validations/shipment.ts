import { z } from 'zod';

export const createShipmentSchema = z.object({
  awbNumber: z.string().max(20).optional(),
  flightId: z.string().uuid().optional(),
  originIata: z.string().length(3, 'Must be a 3-letter IATA code').toUpperCase(),
  destIata: z.string().length(3, 'Must be a 3-letter IATA code').toUpperCase(),
  priority: z.enum(['standard', 'express', 'critical']).default('standard'),
  productType: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  weightKg: z.number().positive(),
  notes: z.string().max(500).optional(),
  estimatedDelivery: z.string().datetime().optional(),
});

export const updateShipmentSchema = createShipmentSchema
  .partial()
  .extend({
    status: z
      .enum(['pending', 'processing', 'in_transit', 'delivered', 'delayed', 'cancelled'])
      .optional(),
    statusNote: z.string().max(500).optional(),
  });

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
