import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@/generated/client";
import Image from "next/image";
import TableActions from "@/components/TableActions";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getClassOptions, getGradeOptions } from "@/lib/queries";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

type StudentList = Student & { class: Class };

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: StudentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={getOptimizedCloudinaryUrl(item.img, 80, 80)}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover md:hidden xl:block"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.class.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">{item.class.name[0]}</td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && <FormContainer table="student" type="delete" id={item.id} />}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: StudentList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-center gap-3">
          <Image
            src={getOptimizedCloudinaryUrl(item.img, 88, 88)}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-sky-100"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-gray-800">
              {item.name} {item.surname}
            </h3>
            <p className="truncate text-xs text-gray-500">@{item.username}</p>
          </div>
          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            Class {item.class.name}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>Grade: {item.class.name[0]}</span>
          {item.phone && <span>📞 {item.phone}</span>}
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
        <span className="text-xs text-gray-400">ID: {item.id.slice(0, 8)}</span>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-lamaSky shadow-sm hover:opacity-90">
              <Image src="/view.png" alt="" width={15} height={15} />
            </button>
          </Link>
          {role === "admin" && <FormContainer table="student" type="delete" id={item.id} />}
        </div>
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.StudentWhereInput = {};

  if (role === "teacher" && currentUserId) {
    query.class = {
      OR: [{ supervisorId: currentUserId }, { lessons: { some: { teacherId: currentUserId } } }],
    };
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.class = {
              lessons: {
                some: {
                  teacherId: value,
                },
              },
            };
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          case "gradeId":
            query.gradeId = parseInt(value);
            break;
          case "search":
            query.OR = [
              { name: { contains: value } },
              { surname: { contains: value } },
              { username: { contains: value } },
              { email: { contains: value } },
              { phone: { contains: value } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.StudentOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    } else if (field === "createdAt") {
      orderBy = { createdAt: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterClasses, filterGrades] = await Promise.all([
    prisma.student.findMany({
      where: query,
      include: {
        class: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
    getClassOptions(),
    getGradeOptions(),
  ]);

  const filterOptions = [
    {
      label: "Class / Section",
      field: "classId",
      options: filterClasses.map((c) => ({ label: `Class ${c.name}`, value: String(c.id) })),
    },
    {
      label: "Grade Level",
      field: "gradeId",
      options: filterGrades.map((g) => ({ label: `Grade ${g.level}`, value: String(g.id) })),
    },
  ];

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Students</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Student Name (A-Z)", field: "name:asc" },
                { label: "Student Name (Z-A)", field: "name:desc" },
                { label: "Newest Enrolled", field: "createdAt:desc" },
                { label: "Oldest Enrolled", field: "createdAt:asc" },
              ]}
              filterOptions={filterOptions}
            />
            {role === "admin" && <FormContainer table="student" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} renderCard={renderCard} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;
