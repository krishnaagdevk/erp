
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AdminScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  createdAt: 'createdAt'
};

exports.Prisma.AccountantScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  surname: 'surname',
  email: 'email',
  phone: 'phone',
  address: 'address',
  img: 'img',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  surname: 'surname',
  email: 'email',
  phone: 'phone',
  address: 'address',
  img: 'img',
  bloodType: 'bloodType',
  sex: 'sex',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt',
  parentId: 'parentId',
  classId: 'classId',
  gradeId: 'gradeId',
  birthday: 'birthday'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  surname: 'surname',
  email: 'email',
  phone: 'phone',
  address: 'address',
  img: 'img',
  bloodType: 'bloodType',
  sex: 'sex',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt',
  birthday: 'birthday'
};

exports.Prisma.ParentScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  surname: 'surname',
  email: 'email',
  phone: 'phone',
  address: 'address',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.GradeScalarFieldEnum = {
  id: 'id',
  level: 'level'
};

exports.Prisma.ClassScalarFieldEnum = {
  id: 'id',
  name: 'name',
  capacity: 'capacity',
  supervisorId: 'supervisorId',
  gradeId: 'gradeId'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.LessonScalarFieldEnum = {
  id: 'id',
  name: 'name',
  day: 'day',
  startTime: 'startTime',
  endTime: 'endTime',
  subjectId: 'subjectId',
  classId: 'classId',
  teacherId: 'teacherId'
};

exports.Prisma.ExamScalarFieldEnum = {
  id: 'id',
  title: 'title',
  startTime: 'startTime',
  endTime: 'endTime',
  lessonId: 'lessonId'
};

exports.Prisma.AssignmentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  fileUrl: 'fileUrl',
  startDate: 'startDate',
  dueDate: 'dueDate',
  lessonId: 'lessonId'
};

exports.Prisma.AssignmentSubmissionScalarFieldEnum = {
  id: 'id',
  assignmentId: 'assignmentId',
  studentId: 'studentId',
  fileUrl: 'fileUrl',
  notes: 'notes',
  status: 'status',
  feedback: 'feedback',
  score: 'score',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResultScalarFieldEnum = {
  id: 'id',
  score: 'score',
  examId: 'examId',
  assignmentId: 'assignmentId',
  studentId: 'studentId'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  date: 'date',
  present: 'present',
  studentId: 'studentId',
  lessonId: 'lessonId'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  classId: 'classId'
};

exports.Prisma.AnnouncementScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  date: 'date',
  classId: 'classId',
  teacherId: 'teacherId'
};

exports.Prisma.FeeScalarFieldEnum = {
  id: 'id',
  title: 'title',
  feeType: 'feeType',
  amount: 'amount',
  paidAmount: 'paidAmount',
  dueDate: 'dueDate',
  status: 'status',
  academicYear: 'academicYear',
  studentId: 'studentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.FeePaymentScalarFieldEnum = {
  id: 'id',
  receiptNo: 'receiptNo',
  feeId: 'feeId',
  amount: 'amount',
  paymentDate: 'paymentDate',
  paymentMethod: 'paymentMethod',
  transactionId: 'transactionId',
  remarks: 'remarks',
  recordedBy: 'recordedBy',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  actorRole: 'actorRole',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  details: 'details',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.StoredFileScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  bucket: 'bucket',
  key: 'key',
  fileName: 'fileName',
  fileType: 'fileType',
  fileSize: 'fileSize',
  category: 'category',
  publicUrl: 'publicUrl',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserSex = exports.$Enums.UserSex = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
};

exports.Day = exports.$Enums.Day = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY'
};

exports.SubmissionStatus = exports.$Enums.SubmissionStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  GRADED: 'GRADED',
  LATE: 'LATE'
};

exports.FeeType = exports.$Enums.FeeType = {
  TUITION: 'TUITION',
  TRANSPORT: 'TRANSPORT',
  EXAM: 'EXAM',
  ADMISSION: 'ADMISSION',
  ANNUAL: 'ANNUAL',
  LAB_LIBRARY: 'LAB_LIBRARY',
  HOSTEL: 'HOSTEL',
  OTHER: 'OTHER'
};

exports.FeeStatus = exports.$Enums.FeeStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  UPI_ONLINE: 'UPI_ONLINE',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE'
};

exports.Prisma.ModelName = {
  Admin: 'Admin',
  Accountant: 'Accountant',
  Student: 'Student',
  Teacher: 'Teacher',
  Parent: 'Parent',
  Grade: 'Grade',
  Class: 'Class',
  Subject: 'Subject',
  Lesson: 'Lesson',
  Exam: 'Exam',
  Assignment: 'Assignment',
  AssignmentSubmission: 'AssignmentSubmission',
  Result: 'Result',
  Attendance: 'Attendance',
  Event: 'Event',
  Announcement: 'Announcement',
  Fee: 'Fee',
  FeePayment: 'FeePayment',
  AuditLog: 'AuditLog',
  StoredFile: 'StoredFile'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
