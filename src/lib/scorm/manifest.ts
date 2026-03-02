/**
 * Build SCORM 1.2 imsmanifest.xml
 * Single item (index.html) for the full course.
 */
export function buildImsManifest(courseId: string, courseTitle: string): string {
  const identifier = `scorm_${courseId.replace(/-/g, "_")}`;
  const resourceId = "resource_index";
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${escapeXml(identifier)}">
    <organization identifier="${escapeXml(identifier)}">
      <title>${escapeXml(courseTitle)}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${escapeXml(courseTitle)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html" />
      <file href="scorm-api-wrapper.js" />
      <file href="scorm-completion.js" />
    </resource>
  </resources>
</manifest>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
