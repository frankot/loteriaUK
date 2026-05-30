import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "./users-table";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
};

const PAGE_SIZE = 30;

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { search, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1") || 1);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { entries: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Serialize for client component
  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    entriesCount: u._count.entries,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-ink">Users</h1>
      </div>

      <UsersTable
        users={serialized}
        locale={locale}
        totalPages={totalPages}
        currentPage={page}
        searchParam={search}
      />
    </div>
  );
}
