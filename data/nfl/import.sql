select * from games;
select count(*) from games;
select count(*) from games where final_home_score is not null;
select * from plays;

--delete from games where id is not null;
--delete from plays where id is not null;
delete from plays where qtr != 4

select * from plays where game_id like '2020%';
select * from plays where game_id like '2021%';
select * from plays where game_id like '2006%';


select * from plays where game_id='2006_18_DAL_SEA'  order by game_seconds_remaining;


ALTER TABLE games add column final_home_score smallint;
ALTER TABLE games add column final_away_score smallint;


DO $$
DECLARE
    game_rec RECORD;
    final_home INTEGER;
    final_away INTEGER;
    interim_home INTEGER;
    interim_away INTEGER;
    stay_count INTEGER:=0;
    overturn_count INTEGER:=0;
    interim_winner TEXT:='';
    final_winner TEXT:='';
    score_diff INTEGER:= 0;
    prob float := 0;
    
    game_cur CURSOR FOR
        SELECT id FROM games;
BEGIN

    OPEN game_cur;
    LOOP
        FETCH game_cur INTO game_rec;
        EXIT WHEN NOT FOUND;

        -- Fetch total_home_score for this game
        SELECT p.total_home_score, p.total_away_score
        INTO final_home, final_away
        FROM plays p
        WHERE p.game_id = game_rec.id AND p.qtr=4
        ORDER BY game_seconds_remaining
        LIMIT 1;  -- optional, in case multiple plays per game

        -- Fetch total_home_score for this game
        SELECT p.total_home_score, p.total_away_score
        INTO interim_home, interim_away
        FROM plays p
        WHERE p.game_id = game_rec.id AND p.qtr=4 and game_seconds_remaining > 60 and game_seconds_remaining <= 120
        ORDER BY game_seconds_remaining
        LIMIT 1;  -- optional, in case multiple plays per game

        IF (final_home is not null and final_away is not null) THEN
            RAISE NOTICE 'Game ID: %, total_home: %, total_away: %', game_rec.id, final_home, final_away;

            update games set final_home_score=final_home, final_away_score=final_away where id=game_rec.id;

            -- who's in the lead?
            if (interim_home > interim_away) then
                interim_winner = 'home';
            end if;
            if (interim_home < interim_away) then
                interim_winner = 'away';
            end if;

            --who won?
            if (final_home > final_away) then
                final_winner := 'home';
            end if;
            if (final_home < final_away) then
                final_winner := 'away';
            end if;

            score_diff := ABS(interim_home - interim_away);

            if (score_diff > 3) then 
                if (interim_winner = final_winner) THEN
                    stay_count := stay_count + 1;
                end if;
                if (interim_winner != final_winner) THEN
                    overturn_count := overturn_count + 1;
                end if;

                IF (interim_home is not null and interim_away is not null) THEN
                    RAISE NOTICE 'Game ID: %, interim_home: %, interim_away: %', game_rec.id, interim_home, interim_away;
                END IF;
            end if;
        END IF;

        RAISE NOTICE '---';
    END LOOP;
    CLOSE game_cur;

    RAISE NOTICE 'Stay count: %', stay_count;
    RAISE NOTICE 'Overturn count: %', overturn_count;

    prob := (CAST(overturn_count as numeric)/CAST(stay_count as numeric));
    RAISE NOTICE 'Probability of overturn: %', prob;
END $$;



select * from plays where qtr=4 and game_id='2006_01_PHI_HOU' order by game_seconds_remaining limit 1;
