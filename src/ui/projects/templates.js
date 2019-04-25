import defaultTemplateUrl from "../../assets/templates/default.spoke";

const templates = [
  {
    id: "test",
    name: "Test",
    thumbnailUrl: "",
    url: defaultTemplateUrl
  }
];

function transformUrls(templates) {
  const searchParams = new URLSearchParams();

  for (const template of templates) {
    searchParams.set("template", template.url);
    template.url = "/projects/new?" + searchParams;
  }

  return templates;
}

export default transformUrls(templates);
