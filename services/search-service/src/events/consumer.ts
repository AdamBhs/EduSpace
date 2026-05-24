import { subscribeToEvents, Events } from "../../../../shared/src";
import { indexPost, updatePost, removePost, removeByClass } from "../utils/elastic";

export async function startConsumers(): Promise<void> {
  await subscribeToEvents(
    "search-service",
    [
      Events.POST_CREATED,
      Events.POST_UPDATED,
      Events.POST_DELETED,
      Events.CLASSROOM_DELETED,
    ],
    async (event, payload) => {
      switch (event) {
        case Events.POST_CREATED: {
          await indexPost({
            postId: payload.postId,
            classId: payload.classId,
            chapterId: payload.chapterId,
            authorId: payload.authorId,
            title: payload.title,
            content: payload.content,
            type: payload.type,
            studyMaterialType: payload.studyMaterialType,
            attachmentNames: payload.attachmentNames,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
          });
          console.log(`[Event] Indexed post ${payload.postId}`);
          break;
        }

        case Events.POST_UPDATED: {
          await updatePost(payload.postId, {
            title: payload.title,
            content: payload.content,
            chapterId: payload.chapterId,
            type: payload.type,
            studyMaterialType: payload.studyMaterialType,
            attachmentNames: payload.attachmentNames,
            updatedAt: payload.updatedAt,
          });
          console.log(`[Event] Updated index for post ${payload.postId}`);
          break;
        }

        case Events.POST_DELETED: {
          await removePost(payload.postId);
          console.log(`[Event] Removed post ${payload.postId} from index`);
          break;
        }

        case Events.CLASSROOM_DELETED: {
          await removeByClass(payload.classId);
          console.log(`[Event] Removed all posts for classroom ${payload.classId} from index`);
          break;
        }
      }
    },
  );
}
