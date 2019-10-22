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

import openTerrainTemplateUrl from "../../assets/templates/tutorial.spoke";
import openTerrainTemplateThumbnail from "../../assets/templates/tutorial.jpg";

const templates = [
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
  },

  {
    id: "trippytunnel",
    name: "Trippy Tunnel",
    thumbnailUrl: trippytunnelTemplateThumbnail,
    url: trippytunnelTemplateUrl
  },

  {
    id: "wideopen",
    name: "Wide Open Space",
    thumbnailUrl: wideopenTemplateThumbnail,
    url: wideopenTemplateUrl
  },

  {
    id: "openterrain",
    name: "Open Terrain",
    thumbnailUrl: openTerrainTemplateThumbnail,
    url: openTerrainTemplateUrl
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
