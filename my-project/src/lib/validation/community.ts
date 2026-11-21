import { z } from "zod";
import { uuidSchema } from "./common";

// data-model.md encouragements.recipient_id, encouragements.phrase_id (phrase text is preset: encouragement_phrases.text)
export const encouragementSchema = z.object({ recipientId: uuidSchema, phraseId: uuidSchema });
