import { Guild, User, GuildMember } from "./generated"

export interface GuildWithMembers extends Guild {
  leader: Pick<User, 'id' | 'name'>
  _count: {
    members: number
  }
  members: (GuildMember & {
    user: Pick<User, 'id' | 'name'>
  })[]
}