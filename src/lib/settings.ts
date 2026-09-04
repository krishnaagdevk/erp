export const ITEM_PER_PAGE = 10;

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin($|/.*)": ["admin"],
  "/accountant($|/.*)": ["admin", "accountant"],
  "/student($|/.*)": ["student"],
  "/teacher($|/.*)": ["teacher"],
  "/parent($|/.*)": ["parent"],
  "/list/teachers($|/.*)": ["admin", "teacher"],
  "/list/students($|/.*)": ["admin", "teacher", "accountant"],
  "/list/parents($|/.*)": ["admin", "teacher", "accountant"],
  "/list/accountants($|/.*)": ["admin"],
  "/list/fees($|/.*)": ["admin", "accountant"],
  "/list/subjects($|/.*)": ["admin"],
  "/list/classes($|/.*)": ["admin", "teacher"],
  "/list/lessons($|/.*)": ["admin", "teacher"],
  "/list/exams($|/.*)": ["admin", "teacher", "student", "parent"],
  "/list/assignments($|/.*)": ["admin", "teacher", "student", "parent"],
  "/list/results($|/.*)": ["admin", "teacher", "student", "parent"],
  "/list/attendance($|/.*)": ["admin", "teacher", "student", "parent"],
  "/list/events($|/.*)": ["admin", "teacher", "student", "parent"],
  "/list/messages($|/.*)": ["admin", "teacher", "student", "parent", "accountant"],
  "/list/announcements($|/.*)": ["admin", "teacher", "student", "parent", "accountant"],
  "/profile($|/.*)": ["admin", "teacher", "student", "parent", "accountant"],
  "/settings($|/.*)": ["admin", "teacher", "student", "parent", "accountant"],
};
