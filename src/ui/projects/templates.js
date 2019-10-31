import cliffmeetingTemplateUrl from "../../assets/templates/cliffside-meeting-room.spoke";
import cliffmeetingTemplateThumbnail from "../../assets/templates/cliffside-meeting-room.jpg";

import clubhubTemplateUrl from "../../assets/templates/club-hub.spoke";
import clubhubTemplateThumbnail from "../../assets/templates/club-hub.jpg";

import cudilleroTemplateUrl from "../../assets/templates/cudillero-diorama.spoke";
import cudilleroTemplateThumbnail from "../../assets/templates/cudillero-diorama.jpg";

import hunterslodgeTemplateUrl from "../../assets/templates/hunters-lodge.spoke";
import hunterslodgeTemplateThumbnail from "../../assets/templates/hunters-lodge.jpg";

import mozatriumTemplateUrl from "../../assets/templates/moz-atrium.spoke";
import mozatriumTemplateThumbnail from "../../assets/templates/moz-atrium.jpg";

import outdoormeetupTemplateUrl from "../../assets/templates/outdoor-meetup.spoke";
import outdoormeetupTemplateThumbnail from "../../assets/templates/outdoor-meetup.jpg";

import riverislandTemplateUrl from "../../assets/templates/river-island.spoke";
import riverislandTemplateThumbnail from "../../assets/templates/river-island.jpg";

import trippytunnelTemplateUrl from "../../assets/templates/trippy-tunnel.spoke";
import trippytunnelTemplateThumbnail from "../../assets/templates/trippy-tunnel.jpg";

import wideopenTemplateUrl from "../../assets/templates/wide-open-space.spoke";
import wideopenTemplateThumbnail from "../../assets/templates/wide-open-space.jpg";

import craterTemplateUrl from "../../assets/templates/crater.spoke";
import craterTemplateThumbnail from "../../assets/templates/crater.jpg";

import surroundedLakeTemplateUrl from "../../assets/templates/surrounded-lake.spoke";
import surroundedLakeTemplateThumbnail from "../../assets/templates/surrounded-lake.jpg";

import archKitExampleTemplateUrl from "../../assets/templates/arch-kit-example.spoke";
import archKitExampleThumbnail from "../../assets/templates/arch-kit-example.jpg";

const templates = [
  {
    id: "crater",
    name: "Crater",
    thumbnailUrl: craterTemplateThumbnail,
    url: craterTemplateUrl
  },
  {
    id: "surroundedlake",
    name: "Surrounded Lake",
    thumbnailUrl: surroundedLakeTemplateThumbnail,
    url: surroundedLakeTemplateUrl
  },
  {
    id: "mozatrium",
    name: "Moz Atrium",
    thumbnailUrl: mozatriumTemplateThumbnail,
    url: mozatriumTemplateUrl
  },

  {
    id: "outdoormeetup",
    name: "Outdoor Meetup",
    thumbnailUrl: outdoormeetupTemplateThumbnail,
    url: outdoormeetupTemplateUrl
  },

  {
    id: "riverisland",
    name: "River Island",
    thumbnailUrl: riverislandTemplateThumbnail,
    url: riverislandTemplateUrl
  },

  {
    id: "clubhub",
    name: "Club Hub",
    thumbnailUrl: clubhubTemplateThumbnail,
    url: clubhubTemplateUrl
  },

  {
    id: "cliffmeeting",
    name: "Cliffside Meeting Room",
    thumbnailUrl: cliffmeetingTemplateThumbnail,
    url: cliffmeetingTemplateUrl
  },

  {
    id: "trippytunnel",
    name: "Trippy Tunnel",
    thumbnailUrl: trippytunnelTemplateThumbnail,
    url: trippytunnelTemplateUrl
  },

  {
    id: "arch-kit-example",
    name: "Architecture Kit Example",
    thumbnailUrl: archKitExampleThumbnail,
    url: archKitExampleTemplateUrl
  },

  {
    id: "wideopen",
    name: "Wide Open Space",
    thumbnailUrl: wideopenTemplateThumbnail,
    url: wideopenTemplateUrl
  },

  {
    id: "cudillero",
    name: "Cudillero Diorama",
    thumbnailUrl: cudilleroTemplateThumbnail,
    url: cudilleroTemplateUrl
  },

  {
    id: "hunterslodge",
    name: "Hunter's Lodge",
    thumbnailUrl: hunterslodgeTemplateThumbnail,
    url: hunterslodgeTemplateUrl
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
