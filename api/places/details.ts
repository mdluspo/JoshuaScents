import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore, requiredEnv } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({ placeId: z.string().min(2).max(300), sessionToken: z.string().uuid() }).safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "A valid place is required");
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(parsed.data.placeId)}`, {
      headers: {
        "X-Goog-Api-Key": requiredEnv("GOOGLE_MAPS_SERVER_KEY"),
        "X-Goog-FieldMask": "formattedAddress,addressComponents,location",
        "X-Goog-Session-Token": parsed.data.sessionToken,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(502, "Address details are temporarily unavailable", data);
    const components = data.addressComponents ?? [];
    const component = (type: string) => components.find((item: any) => item.types?.includes(type))?.longText ?? "";
    return res.status(200).json({
      address: data.formattedAddress,
      city: component("locality") || component("administrative_area_level_2") || component("administrative_area_level_1"),
      zip: component("postal_code"),
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
    });
  } catch (error) { return handleApiError(res, error); }
}
