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

const templates = [
  {
    project_id: "crater",
    name: "Crater",
    thumbnail_url: craterTemplateThumbnail,
    project_url: craterTemplateUrl
  },
  {
    project_id: "surroundedlake",
    name: "Surrounded Lake",
    thumbnail_url: surroundedLakeTemplateThumbnail,
    project_url: surroundedLakeTemplateUrl
  },
  {
    project_id: "mozatrium",
    name: "Moz Atrium",
    thumbnail_url: mozatriumTemplateThumbnail,
    project_url: mozatriumTemplateUrl
  },

  {
    project_id: "outdoormeetup",
    name: "Outdoor Meetup",
    thumbnail_url: outdoormeetupTemplateThumbnail,
    project_url: outdoormeetupTemplateUrl
  },

  {
    project_id: "riverisland",
    name: "River Island",
    thumbnail_url: riverislandTemplateThumbnail,
    project_url: riverislandTemplateUrl
  },

  {
    project_id: "clubhub",
    name: "Club Hub",
    thumbnail_url: clubhubTemplateThumbnail,
    project_url: clubhubTemplateUrl
  },

  {
    project_id: "cliffmeeting",
    name: "Cliffside Meeting Room",
    thumbnail_url: cliffmeetingTemplateThumbnail,
    project_url: cliffmeetingTemplateUrl
  },

  {
    project_id: "cudillero",
    name: "Cudillero Diorama",
    thumbnail_url: cudilleroTemplateThumbnail,
    project_url: cudilleroTemplateUrl
  },

  {
    project_id: "hunterslodge",
    name: "Hunter's Lodge",
    thumbnail_url: hunterslodgeTemplateThumbnail,
    project_url: hunterslodgeTemplateUrl
  },

  {
    project_id: "trippytunnel",
    name: "Trippy Tunnel",
    thumbnail_url: trippytunnelTemplateThumbnail,
    project_url: trippytunnelTemplateUrl
  },

  {
    project_id: "wideopen",
    name: "Wide Open Space",
    thumbnail_url: wideopenTemplateThumbnail,
    project_url: wideopenTemplateUrl
  }
];

function transformUrls(templates) {
  const searchParams = new URLSearchParams();

  for (const template of templates) {
    searchParams.set("template", template.project_url);
    template.url = "/projects/new?" + searchParams;
  }

  return templates;
}

export default transformUrls(templates);
