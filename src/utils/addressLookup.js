/**
 * LBC Moto Address Automation & Pincode Lookup
 * Indian Postal Pincode Auto-Fill (api.postalpincode.in) - 100% Free, No API key required.
 */

// Cache pincode responses in-memory to avoid redundant API hits
const pincodeCache = new Map();

/**
 * Fetch City and State from Indian 6-digit PIN code
 */
export async function lookupPincode(pincode) {
  const cleanPin = String(pincode || "").trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    return { success: false, error: "Pincode must be 6 digits" };
  }

  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin);
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (!res.ok) {
      return { success: false, error: "Could not fetch postal data" };
    }
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const primary = data[0].PostOffice[0];
      const result = {
        success: true,
        city: primary.District || primary.Division || primary.Name || "",
        state: primary.State || "",
        postOffices: data[0].PostOffice.map((po) => po.Name),
        district: primary.District,
        pincode: cleanPin,
      };
      pincodeCache.set(cleanPin, result);
      return result;
    } else {
      const result = { success: false, error: "Invalid or unrecognized pincode" };
      return result;
    }
  } catch (err) {
    console.error("Postal PIN lookup error:", err);
    return { success: false, error: "Network error during pincode lookup" };
  }
}
