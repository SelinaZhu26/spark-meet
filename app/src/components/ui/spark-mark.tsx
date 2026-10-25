import Svg, { Path } from 'react-native-svg';

/** The brand's sparkler, traced from the hand-drawn logo in its 1920px drawing space. */
const STROKES = [
  {
    tone: 'gold',
    width: 32,
    d: 'M1022 728 C1016 721 1000 700 985 688 C970 676 949 664 930 655 C911 646 890 643 870 636 C850 629 830 622 812 612 C794 602 779 590 765 575 C751 560 736 541 726 522 C716 503 707 479 706 462 C705 445 711 431 718 418 C725 405 745 391 750 386',
  },
  {
    tone: 'ink',
    width: 40,
    d: 'M1095 795 C1109 788 1152 768 1180 755 C1208 742 1237 730 1262 716 C1287 702 1313 686 1332 668 C1351 650 1365 629 1376 608 C1387 587 1394 563 1396 540 C1398 517 1390 492 1386 472 C1382 452 1373 429 1370 420',
  },
  {
    tone: 'ink',
    width: 40,
    d: 'M985 770 C976 767 950 755 930 752 C910 749 887 748 868 752 C849 756 831 765 818 778 C805 791 800 815 788 832 C776 849 766 867 748 882 C730 897 703 912 678 922 C653 932 624 943 598 945 C572 947 542 942 520 935 C498 928 478 914 466 902 C454 890 449 872 446 866',
  },
  {
    tone: 'gold',
    width: 32,
    d: 'M1110 860 C1117 863 1132 878 1152 878 C1172 878 1207 865 1230 860 C1253 855 1272 847 1292 846 C1312 845 1332 846 1352 852 C1372 858 1394 867 1410 882 C1426 897 1442 919 1450 942 C1458 965 1457 994 1455 1020 C1453 1046 1440 1075 1440 1100 C1440 1125 1448 1151 1456 1170 C1464 1189 1475 1204 1490 1214 C1505 1224 1536 1227 1545 1230',
  },
  {
    tone: 'ink',
    width: 38,
    d: 'M1000 845 C995 853 976 874 968 892 C960 910 955 932 955 952 C955 972 957 990 966 1012 C975 1034 994 1059 1010 1082 C1026 1105 1049 1132 1060 1150 C1071 1168 1076 1178 1074 1192 C1072 1206 1062 1216 1048 1232 C1034 1248 1006 1270 990 1290 C974 1310 957 1330 950 1350 C943 1370 941 1394 946 1410 C951 1426 960 1439 982 1444 C1004 1449 1064 1442 1080 1442',
  },
  {
    tone: 'ink',
    width: 36,
    d: 'M1150 1012 C1158 1028 1185 1074 1200 1110 C1215 1146 1227 1195 1242 1230 C1257 1265 1275 1290 1292 1322 C1309 1354 1324 1384 1342 1422 C1360 1460 1382 1509 1402 1552 C1422 1595 1441 1642 1462 1682 C1483 1722 1519 1772 1530 1790',
  },
  { tone: 'ash', width: 18, d: 'M868 703 C879 705 911 708 932 714 C953 720 984 737 995 742' },
  {
    tone: 'ash',
    width: 18,
    d: 'M1062 768 C1069 762 1086 743 1102 730 C1118 717 1149 698 1158 692',
  },
  {
    tone: 'gold',
    width: 18,
    d: 'M880 912 C884 905 892 882 902 870 C912 858 928 845 942 838 C956 831 978 831 985 830',
  },
  {
    tone: 'gold',
    width: 18,
    d: 'M1132 846 C1140 842 1152 828 1182 820 C1212 812 1289 803 1310 800',
  },
  {
    tone: 'ash',
    width: 18,
    d: 'M1062 870 C1062 879 1052 904 1060 922 C1068 940 1092 963 1110 976 C1128 989 1154 998 1170 1000 C1186 1002 1199 988 1205 985',
  },
] as const;

const VIEW = { x: 400, y: 350, width: 1200, height: 1480 };

export type SparkMarkProps = {
  /** Height in points; the mark is a little taller than wide. */
  size: number;
  ink?: string;
  gold?: string;
  ash?: string;
};

/** The Spark logo. Strokes keep a legible minimum width at small sizes. */
export function SparkMark({
  size,
  ink = '#1E1E1C',
  gold = '#F5C94E',
  ash = '#5C5C5A',
}: SparkMarkProps) {
  const scale = size / VIEW.height;
  const colors = { ink, gold, ash };
  return (
    <Svg
      width={(size * VIEW.width) / VIEW.height}
      height={size}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
      {STROKES.map((stroke, index) => (
        <Path
          key={index}
          d={stroke.d}
          fill="none"
          stroke={colors[stroke.tone]}
          strokeWidth={Math.max(stroke.width, (stroke.width > 20 ? 1.6 : 1.1) / scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
