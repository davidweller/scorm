import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.create({
    data: {
      title: "Sample Course",
      overview: "A sample course to demonstrate the builder.",
      brandConfig: {
        primary: "#2563eb",
        secondary: "#1e40af",
        accent: "#3b82f6",
        background: "#ffffff",
        font: "Inter",
      },
      modules: {
        create: {
          title: "Module 1",
          order: 0,
          lessons: {
            create: {
              title: "Lesson 1.1",
              order: 0,
              pages: {
                create: {
                  title: "Introduction",
                  order: 0,
                  contentBlocks: {
                    create: [
                      { type: "heading", content: { level: 1, text: "Welcome" }, order: 0 },
                      { type: "text", content: { text: "This is the first page." }, order: 1 },
                    ],
                  },
                  interactionBlocks: {
                    create: {
                      type: "reflection",
                      config: { prompt: "What do you hope to learn?" },
                      order: 0,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    include: {
      modules: { include: { lessons: { include: { pages: true } } } },
    },
  });
  console.log("Created sample course:", course.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
