export type OpenDotaHeroRecord = {
  id: number;
  name: string;
  localized_name: string;
  primary_attr?: string;
  attack_type?: string;
  roles?: string[];
  img?: string;
  icon?: string;
};
