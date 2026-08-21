import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Sunucu bileşenlerinde Payload'a erişim.
 * getPayload kendi içinde önbelleklenir; her çağrıda yeni bağlantı açılmaz.
 */
export const getPayloadClient = () => getPayload({ config });
