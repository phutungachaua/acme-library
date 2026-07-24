import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
const books=[
  {title:"Tư duy nhanh và chậm",code:"TTNVC",author:"Daniel Kahneman",category:"Tâm lý học",description:"Một hành trình sâu sắc vào hai hệ thống tư duy chi phối mọi quyết định của con người.",review:"Thư viện chọn cuốn sách này như một nền tảng để hiểu thiên kiến nhận thức, cách chúng ta đánh giá rủi ro và đưa ra quyết định trong công việc.",highlights:"• Nhận diện tư duy trực giác và tư duy phân tích\n• Hiểu các thiên kiến thường gặp\n• Cải thiện chất lượng quyết định",forWhom:"Người làm sản phẩm, quản lý, nghiên cứu và bất kỳ ai muốn tư duy rõ ràng hơn."},
  {title:"The Design of Everyday Things",code:"DOET",author:"Don Norman",category:"Thiết kế",description:"Cuốn sách kinh điển về thiết kế lấy con người làm trung tâm và cách làm cho sản phẩm dễ hiểu, dễ dùng.",review:"Một tài liệu thiết yếu cho đội ngũ sản phẩm. Don Norman biến những cánh cửa, công tắc và giao diện thành bài học rõ ràng về affordance, feedback và lỗi người dùng.",highlights:"• Nền tảng human-centered design\n• Thiết kế ngăn lỗi thay vì trách người dùng\n• Mô hình khái niệm rõ ràng",forWhom:"Designer, product manager, engineer và người xây dựng trải nghiệm số."},
  {title:"Clean Architecture",code:"CLARCH",author:"Robert C. Martin",category:"Công nghệ",description:"Các nguyên tắc kiến trúc giúp hệ thống phần mềm bền vững, dễ kiểm thử và thích ứng với thay đổi.",review:"Không phải mọi đề xuất đều cần áp dụng máy móc, nhưng cuốn sách tạo một ngôn ngữ chung rất hữu ích khi thảo luận ranh giới module và phụ thuộc.",highlights:"• Dependency rule\n• Ranh giới kiến trúc\n• Tách nghiệp vụ khỏi framework",forWhom:"Software engineer, tech lead và architect."},
  {title:"Atomic Habits",code:"ATHAB",author:"James Clear",category:"Phát triển bản thân",description:"Phương pháp thực tế để xây thói quen tốt bằng những thay đổi nhỏ nhưng bền vững.",review:"Một cuốn sách dễ tiếp cận, giàu ví dụ thực hành về cách thiết kế môi trường và hệ thống để hành vi tốt trở nên tự nhiên hơn.",highlights:"• Cải thiện 1% mỗi ngày\n• Bốn quy luật thay đổi hành vi\n• Tập trung vào hệ thống",forWhom:"Bất kỳ ai muốn thay đổi thói quen cá nhân hoặc cách làm việc của đội nhóm."}
];
const slugify = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-");

async function main() {
  await prisma.systemSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1, libraryName: "Acme Library" } });
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@acme.local";
  const passwordHash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!", { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { lastMiddleName: "Quản trị", firstName: "Viên", email: adminEmail, phone: "0900000001", passwordHash, role: "SUPER_ADMIN" }
  });
  const location = await prisma.location.upsert({
    where: { area_cabinet_shelf_slot: { area: "Khu A", cabinet: "Tủ 01", shelf: "Ngăn 02", slot: "Ô 01" } },
    update: {},
    create: { area: "Khu A", cabinet: "Tủ 01", shelf: "Ngăn 02", slot: "Ô 01" }
  });
  for (const item of books) {
    const category = await prisma.category.upsert({ where: { name: item.category }, update: {}, create: { name: item.category, slug: slugify(item.category) } });
    const author = await prisma.author.upsert({ where: { name: item.author }, update: {}, create: { name: item.author } });
    const book = await prisma.book.upsert({
      where: { bookCode: item.code },
      update: {},
      create: { title: item.title, slug: `${slugify(item.title)}-${item.code.toLowerCase()}`, bookCode: item.code, shortDescription: item.description, editorialReview: item.review, highlights: item.highlights, recommendedFor: item.forWhom, categoryId: category.id, featured: true, authors: { create: { authorId: author.id } } }
    });
    for (let i = 1; i <= 3; i += 1) {
      const copyCode = `${item.code}-${String(i).padStart(3, "0")}`;
      await prisma.bookCopy.upsert({ where: { copyCode }, update: {}, create: { copyCode, bookId: book.id, locationId: location.id } });
    }
  }
  console.log("Seed complete. Admin:", adminEmail);
}

main().finally(() => prisma.$disconnect());
