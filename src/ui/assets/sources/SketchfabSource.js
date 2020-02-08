import ModelMediaSource from "../ModelMediaSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class SketchfabSource extends ModelMediaSource {
  constructor(api) {
    super(api);
    this.id = "sketchfab";
    this.name = "Sketchfab";
    this.tags = [
      {
        disabled: true,
        label: "Categories",
        value: "categories",
        children: [
          { label: "Featured", value: "featured" },
          { label: "Animals", value: "animals-pets" },
          { label: "Architecture", value: "architecture" },
          { label: "Art", value: "art-abstract" },
          { label: "Vehicles", value: "cars-vehicles" },
          { label: "Characters", value: "characters-creatures" },
          { label: "Culture", value: "cultural-heritage-history" },
          { label: "Gadgets", value: "electronics-gadgets" },
          { label: "Fashion", value: "fashion-style" },
          { label: "Food", value: "food-drink" },
          { label: "Furniture", value: "furniture-home" },
          { label: "Music", value: "music" },
          { label: "Nature", value: "nature-plants" },
          { label: "News", value: "news-politics" },
          { label: "People", value: "people" },
          { label: "Places", value: "places-travel" },
          { label: "Science", value: "science-technology" },
          { label: "Sports", value: "sports-fitness" },
          { label: "Weapons", value: "weapons-military" }
        ]
      },
      {
        disabled: true,
        label: "Collections",
        value: "collections",
        children: [
          {
            label: "Hubs Scene Props",
            value: "51b7fd61abd04bc888cc8e7146125741",
            paramsKey: "collection",
            initialNodeProps: {
              initialScale: "fit",
              castShadow: true,
              receiveShadow: true
            },
            itemProps: {
              transformPivot: TransformPivot.Bottom
            }
          },
          {
            label: "Hubs Recommended Props",
            value: "6cc8879692694161b1208c4626c48aba",
            paramsKey: "collection",
            initialNodeProps: {
              initialScale: "fit"
            },
            itemProps: {
              transformPivot: TransformPivot.Bottom
            }
          },
          {
            disabled: true,
            label: "Medieval Fantasy Contest",
            value: "medieval-fantasy-contest",
            children: [
              {
                label: "Medieval City Builder - by Eanorien",
                value: "355623519b124985a08c4370d93a3810",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Sky Castle - by Alok",
                value: "bdf05d92317b4bfba9ffd81fea39a368",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Middle Ages Mine - by Vladislav Laryushin",
                value: "d106792122154e8ba89b5f28f1889f8b",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Medieval Labyrinth - by NomadKing",
                value: "965f436a8aff41548cc5fa689ac114b8",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Medieval Town Port - by lakos",
                value: "6c227e9f36fc4558a23de3f4af9a5c80",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Assassin Hideout - by marti3d",
                value: "05c5c177f1c7403597c18b6c14886b63",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Medieval Castle with Village - by Artbake Graphics",
                value: "39a126f30394489d9de6af7f452d553a",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Medieval Fantasy Book - by Pixel",
                value: "cf717f81734b4eefba9f17e9e6a1c9e4",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Blacksmith's Workshop - by Kyan0s",
                value: "a013c33e56a44b479cc527e2dc992b7f",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Castle, Siege, Army - by BlackSpire",
                value: "53b764aab88b472ebe4ad80c4148c336",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Treasure Island - by rogueisland",
                value: "8f14c1d6b54d467784dfccb82aa882eb",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Medieval Country Village - by David",
                value: "2c995b31f2774df1b8fac87e65b1752d",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Mobile Dragon Shop - by Nive",
                value: "ef4745784f664105a76d009d56004f15",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "The Tavern - by François Espagnet",
                value: "9983f117e3a8471da0076e8dadce2438",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Dragon Attack Aftermath - by Guillermo T",
                value: "d5445aa9dc8a457bb225c4d4ce9ce97f",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Building Modules - by Tobal",
                value: "ca06c20e01a1405f9bc444fe36cdc175",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "The Great Sorcerer's Room - by moyicat",
                value: "316a36ae8dac4ab281baa79f79ef38c2",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Plateau Sanctuary - by BenjiToddArtist",
                value: "4409d7ed90054082bf9e626cde88a9a9",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Throne Room - by tuturu",
                value: "e3ad5aebeaa84806afcc4b0efe4ae39b",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Dark Age Motte and Bailey - by MattMakesSwords",
                value: "50758d11ea7146378f96440655682ce0",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 2.25,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Market Square - by Feyfolken",
                value: "50b5b42e549748418f93354c785a195c",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Cemetary Fantasy Battle - by daniel_slusarz",
                value: "7eaba35bf3e54475b8ecefa0e7725bb8",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 0.01,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: `"The Drunk Troll" Tavern - by mrrobot`,
                value: "b0e926a29dd644e48fd4c40fd416f0b8",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 0.04,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              {
                label: "Siege Equipment - by Carrigan Raketic",
                value: "cc6b26d45b2a4d45be66ccdc80d5ba86",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 3,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              }
            ]
          },
          {
            disabled: true,
            label: "Hubs Clubhouse Contest",
            value: "hubs-clubhouse-contest",
            children: [
              {
                label: "Mozilla Playground - by Tombolaso",
                value: "cfdeae6bb4ba480e9ca0c52b6a7965bd",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              // TODO: Requires support for glTF Specular Glossiness Material
              // {
              //   label: "TeaScroll Clubhouse - by Anaïs Faure",
              //   value: "17246743abc641d2b76d22b50c4d7173",
              //   paramsKey: "collection",
              //   initialNodeProps: {
              //     initialScale: 1,
              //     castShadow: true,
              //     receiveShadow: true
              //   },
              //   itemProps: {
              //     transformPivot: TransformPivot.Bottom
              //   }
              // },
              {
                label: "Wizard's Library - by mediochrea",
                value: "9ed3d50e891d4261a6b31d664869d419",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 0.01,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Tree House - by grigoriyarx",
                value: "6e739d5f763043769828569164d6fad0",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Theatre - by daedaljs",
                value: "aede4e128b284e9d9672038bdbfd8423",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Round Table Room - by plasmaernst",
                value: "486d77de949749a998e1be80b7be5bd6",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 0.01,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Space Dome - by rudolfs",
                value: "ce3cdb49e8144b51a8beb3a5b3aa191c",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 0.01,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Summer Festival - by proxy_doug",
                value: "44fc5a8ed00943fd82002c78027bfe3e",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Selection
                }
              },
              // TODO: Requires support for glTF Specular Glossiness Material
              // {
              //   label: "Museum - by Thomas Flynn",
              //   value: "46c4fd78da6a41f98c3ad8c1a0647aad",
              //   paramsKey: "collection",
              //   initialNodeProps: {
              //     initialScale: 1,
              //     castShadow: true,
              //     receiveShadow: true
              //   },
              //   itemProps: {
              //     transformPivot: TransformPivot.Bottom
              //   }
              // },
              {
                label: "Space Smugglers Clubhouse - by sawcisson",
                value: "9edad35200f44fc09c42ddd5fca73c8e",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              },
              {
                label: "Morning Dew Coffee Shop - by CameronMckenzie",
                value: "4a4511d656374c79a743c4b17efea961",
                paramsKey: "collection",
                initialNodeProps: {
                  initialScale: 1,
                  castShadow: true,
                  receiveShadow: true
                },
                itemProps: {
                  transformPivot: TransformPivot.Bottom
                }
              }
            ]
          }
        ]
      }
    ];

    this.searchLegalCopy = "Search by Sketchfab";
    this.privacyPolicyUrl = "https://sketchfab.com/privacy";
    this.transformPivot = TransformPivot.Bottom;
  }
}
