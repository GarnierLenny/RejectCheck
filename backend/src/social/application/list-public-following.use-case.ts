import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';
import type { FollowList, ListPaginationInput } from '../domain/social.types';

@Injectable()
export class ListPublicFollowingUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    rawUsername: string,
    pagination: ListPaginationInput,
    viewerEmail?: string,
  ): Promise<FollowList> {
    const username = rawUsername.toLowerCase();
    const profileId = await this.repo.getProfileIdByUsername(username);
    if (!profileId) throw new NotFoundException('Profile not found');
    const list = await this.repo.listFollowing(profileId, pagination, {
      onlyPublic: true,
    });
    return this.annotateIsFollowing(list, viewerEmail);
  }

  private async annotateIsFollowing(
    list: FollowList,
    viewerEmail?: string,
  ): Promise<FollowList> {
    if (!viewerEmail || list.entries.length === 0) return list;
    const viewerId = await this.repo.getProfileIdByEmail(viewerEmail);
    if (!viewerId) return list;
    const usernames = list.entries.map((e) => e.username);
    const ids = await Promise.all(
      usernames.map((u) => this.repo.getProfileIdByUsername(u)),
    );
    const validIds = ids.filter((id): id is number => id !== null);
    const followed = await this.repo.whichAreFollowedBy(viewerId, validIds);
    const idByUsername = new Map(usernames.map((u, i) => [u, ids[i]]));
    return {
      ...list,
      entries: list.entries.map((entry) => {
        const peerId = idByUsername.get(entry.username);
        return {
          ...entry,
          isFollowing: peerId != null ? followed.has(peerId) : false,
        };
      }),
    };
  }
}
