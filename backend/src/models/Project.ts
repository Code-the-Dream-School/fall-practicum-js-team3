import { Schema, model, type InferSchemaType } from 'mongoose';

const projectSchema = new Schema(
    {
        // PostgreSQL users.id (the JWT `sub`), stored as a string. No cross-database join. 
        // needs feedback on this apporoach from team
        owner: { type: String, required: true },
        name: { type: String, required: true, trim: true, maxlength: 100 },
        design: {
            schemaVersion: { type: Number, required: true },
            // Contents are validated by the E2-T5 helper before they reach the model.
            shapes: { type: [Schema.Types.Mixed], default: [] },
        },
    },
    { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ owner: 1, name: 1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema>;
export const Project = model('Project', projectSchema);